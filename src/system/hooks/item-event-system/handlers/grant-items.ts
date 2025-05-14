import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/events';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface GrantItemsHandlerConfigData {
    /**
     * Whether to grant items to the actor even if they already have them
     * @default false
     */
    allowDuplicates: boolean;

    /**
     * Whether to increase the quantity of physical items if the actor already has it
     * @default false
     */
    increaseQuantity: boolean;

    /**
     * The amount of quantity to grant.
     * Only used if `increaseQuantity` is true and the item is physical.
     * @default 1
     */
    amount: number;

    /**
     * The UUIDs of the items to grant
     */
    items: string[];
}

// TODO: Localization
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.GrantItems,
        label: 'Grant Items',
        config: {
            schema: {
                allowDuplicates: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'Allow Duplicates',
                    hint: 'Whether to grant items to the actor even if they already have them',
                }),
                increaseQuantity: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'Increase Quantity',
                    hint: 'Whether to increase the quantity of physical items if the actor already has them',
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    min: 1,
                    integer: true,
                    label: 'Amount',
                    hint: 'The amount of quantity to grant. Only used if "Increase Quantity" is enabled and the item is physical.',
                }),
                items: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.DocumentUUIDField({
                        type: 'Item',
                    }),
                    {
                        required: true,
                        initial: [],
                        label: 'Items',
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_GRANT_ITEMS}`,
        },
        executor: async function (
            this: GrantItemsHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            // Get the actor
            const actor = event.item.actor;

            // Get the items to grant
            const items = (
                (await Promise.all(
                    this.items.map((uuid) => fromUuid(uuid)),
                )) as (CosmereItem | null)[]
            )
                .filter((v) => !!v)
                .filter((item, i, self) => {
                    if (this.allowDuplicates) return true;
                    if (
                        self.findIndex((o) => areSameItems(item, o, true)) !== i
                    )
                        return false;
                    return (
                        (item.isPhysical() && this.increaseQuantity) ||
                        !actor.items.some((other) =>
                            areSameItems(item, other, true),
                        )
                    );
                });

            // Split out the physical items
            const physicalItems = items.filter((item) => item.isPhysical());
            const nonPhysicalItems = items.filter((item) => !item.isPhysical());

            const documentUpdates: object[] = [];
            const documentsToCreate: object[] = [];

            // Handle physical items
            physicalItems.forEach((item) => {
                // Find the existing item in the actor
                const existingItem = actor.items.find((other) =>
                    areSameItems(item, other, true),
                );

                // If the item already exists and we're increasing the quantity, update it, otherwise create a new item
                if (this.increaseQuantity && existingItem) {
                    documentUpdates.push({
                        _id: existingItem.id,
                        'system.quantity': Math.max(
                            existingItem.system.quantity + this.amount,
                            1,
                        ),
                    });
                } else {
                    // Create a new item
                    documentsToCreate.push(
                        foundry.utils.mergeObject(item.toObject(), {
                            'system.quantity': this.amount,
                        }),
                    );
                }
            });

            // Handle non-physical items (always create new items)
            nonPhysicalItems.forEach((item) => {
                documentsToCreate.push(item.toObject());
            });

            // Grant the items to the actor
            await Promise.all([
                actor.updateEmbeddedDocuments('Item', documentUpdates),
                actor.createEmbeddedDocuments('Item', documentsToCreate),
            ]);

            // Notify the user
            items.forEach((item) => {
                ui.notifications.info(
                    `Granted item ${item.name}${
                        this.increaseQuantity &&
                        this.amount > 1 &&
                        item.isPhysical()
                            ? ` (x${this.amount.toFixed()})`
                            : ''
                    } to actor ${event.item.actor!.name}`,
                );
            });
        },
    });
}

/* --- Helpers --- */

function areSameItems(
    a: CosmereItem,
    b: CosmereItem,
    matchName = false,
): boolean {
    if (a === b) return true;
    if (a.type !== b.type) return false;
    return a.hasId() && b.hasId()
        ? a.system.id === b.system.id
        : matchName
          ? a.name === b.name
          : a.id === b.id;
}
