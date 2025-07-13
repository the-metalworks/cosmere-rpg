import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';
import { AnyObject } from '@system/types/utils';

// Dialogs
import { PickDialog } from '@system/applications/dialogs/pick-dialog';

// Utils
import { tryApplyRollData } from '@system/utils/changes';

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
     * Whether to pick one item from the list of items to grant.
     * If `true`, the user will be prompted to pick one item from the list, only that item will be granted.
     * If `false`, all items will be granted.
     * @default false
     */
    pickOne?: boolean;

    /**
     * The title of the prompt shown when picking an item to grant.
     * If not provided, a default title will be used.
     * Only used if `pickOne` is `true`.
     */
    pickPromptTitle?: string;

    /**
     * Whether to send a notification to the user when items are granted.
     *
     * @default true
     */
    notify?: boolean;

    /**
     * The UUIDs of the items to grant and optional quantity formulas.
     */
    items: { uuid: string; quantity?: string }[];
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
                pickOne: new foundry.data.fields.BooleanField({
                    required: false,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.PickOne.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.PickOne.Hint`,
                }),
                pickPromptTitle: new foundry.data.fields.StringField({
                    required: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.PickPromptTitle.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.PickPromptTitle.Hint`,
                }),
                notify: new foundry.data.fields.BooleanField({
                    required: false,
                    initial: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Notify.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.Notify.Hint`,
                }),
                items: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField({
                        uuid: new foundry.data.fields.DocumentUUIDField({
                            type: 'Item',
                        }),
                        quantity: new foundry.data.fields.StringField({
                            required: false,
                        }),
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
            let items = (
                (await Promise.all(
                    this.items.map(({ uuid }) => fromUuid(uuid)),
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

            // Construct map of quantities by UUID
            const quantities = await this.items.reduce(
                async (prev, ref) => {
                    const acc = await prev;

                    // Get the quantity to grant
                    const quantityFormula = ref.quantity ?? '1';

                    // Resolve quantity
                    let quantity = parseInt(
                        await tryApplyRollData(actor, quantityFormula, true),
                    );
                    if (isNaN(quantity) || quantity < 1) quantity = 1;

                    return {
                        ...acc,
                        [ref.uuid]: quantity,
                    };
                },
                Promise.resolve({} as Record<string, number>),
            );

            if (this.pickOne) {
                const picked = await PickDialog.show({
                    title:
                        // NOTE: Use logical OR to provide a default title if field is empty string
                        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                        this.pickPromptTitle ||
                        game.i18n!.localize(
                            `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantItems}.PickPromptTitle.Default`,
                        ),
                    options: items.map((item) => ({
                        id: item.uuid,
                        label: `<span>${item.name}${item.isPhysical() ? ` <span style="font-size:.65em;opacity:.65;">x${quantities[item.uuid]}</span>` : ''}</span>`,
                    })),
                });

                if (!picked) return;

                // Filter items to only the picked item
                items = items.filter((item) => item.uuid === picked);
            }

            // Split out the physical items
            const physicalItems = items.filter((item) => item.isPhysical());
            const nonPhysicalItems = items.filter((item) => !item.isPhysical());

            const documentUpdates: object[] = [];
            const documentsToCreate: object[] = [];

            // Handle physical items
            physicalItems.forEach((item) => {
                const quantity = quantities[item.uuid];

                // Find the existing item in the actor
                const existingItem = actor.items.find((other) =>
                    areSameItems(item, other, true),
                );

                // If the item already exists and we're increasing the quantity, update it, otherwise create a new item
                if (this.increaseQuantity && existingItem) {
                    documentUpdates.push({
                        _id: existingItem.id,
                        'system.quantity': Math.max(
                            existingItem.system.quantity + quantity,
                            1,
                        ),
                    });
                } else {
                    // Create a new item
                    documentsToCreate.push(
                        foundry.utils.mergeObject(item.toObject(), {
                            'system.quantity': quantity,
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

            // Notify the user if enabled
            if (this.notify !== false) {
                items.forEach((item) => {
                    ui.notifications.info(
                        game.i18n!.format('GENERIC.Notification.AddedItem', {
                            item: item.name,
                            quantity:
                                item.isPhysical() && quantities[item.uuid] > 1
                                    ? ` (x${quantities[item.uuid]})`
                                    : '',
                            actor: actor.name,
                        }),
                    );
                });
            }
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
