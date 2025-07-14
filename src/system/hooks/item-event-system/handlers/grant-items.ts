import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';
import { ItemRelationship } from '@system/data/item/mixins/relationships';

// Utils
import ItemRelationshipUtils from '@system/utils/item/relationship';

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

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.GrantItems,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Description`,
        config: {
            schema: {
                allowDuplicates: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.AllowDuplicates.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.AllowDuplicates.Hint`,
                }),
                increaseQuantity: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.IncreaseQuantity.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.IncreaseQuantity.Hint`,
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    min: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Amount.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Amount.Hint`,
                }),
                items: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.DocumentUUIDField({
                        type: 'Item',
                    }),
                    {
                        required: true,
                        initial: [],
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Items.Label`,
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
                    const itemData = foundry.utils.mergeObject(
                        item.toObject(),
                        {
                            'system.quantity': this.amount,
                        },
                    );

                    if (
                        event.item.hasRelationships() &&
                        item.hasRelationships()
                    ) {
                        ItemRelationshipUtils.addRelationshipData(
                            itemData,
                            event.item,
                            ItemRelationship.Type.Parent,
                        );
                    }

                    // Create a new item
                    documentsToCreate.push(itemData);
                }
            });

            // Handle non-physical items (always create new items)
            nonPhysicalItems.forEach((item) => {
                const itemData = item.toObject();

                if (event.item.hasRelationships() && item.hasRelationships()) {
                    ItemRelationshipUtils.addRelationshipData(
                        itemData,
                        event.item,
                        ItemRelationship.Type.Parent,
                    );
                }

                documentsToCreate.push(itemData);
            });

            // Grant the items to the actor
            await Promise.all([
                actor.updateEmbeddedDocuments(
                    'Item',
                    documentUpdates,
                    event.op,
                ),
                actor.createEmbeddedDocuments(
                    'Item',
                    documentsToCreate,
                    event.op,
                ),
            ]);
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
