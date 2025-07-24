import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface RemoveItemsHandlerConfigData {
    /**
     * Whether to reduce the quantity of physical items instead of completely removing them.
     * If the quantity is reduced to 0, the item will still be removed.
     * @default false
     */
    reduceQuantity: boolean;

    /**
     * The amount of quantity to remove.
     * Only used if `reduceQuantity` is true and the item is physical.
     * @default 1
     */
    amount: number;

    /**
     * The UUIDs of
     */
    items: string[];
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.RemoveItems,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.Description`,
        config: {
            schema: {
                reduceQuantity: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.ReduceQuantity.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.ReduceQuantity.Hint`,
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    min: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.Amount.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.Amount.Hint`,
                }),
                items: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.DocumentUUIDField({
                        type: 'Item',
                    }),
                    {
                        required: true,
                        initial: [],
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveItems}.Items.Label`,
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_REMOVE_ITEMS}`,
        },
        executor: async function (
            this: RemoveItemsHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            // Get the actor
            const actor = event.item.actor;

            // Get the items to remove
            const referenceItems = (
                (await Promise.all(
                    this.items.map((uuid) => fromUuid(uuid)),
                )) as (CosmereItem | null)[]
            )
                .filter((v) => !!v)
                .filter(
                    (item, i, self) =>
                        self.findIndex(
                            (o) =>
                                item.type === o.type &&
                                (item.hasId() && o.hasId()
                                    ? item.system.id === o.system.id
                                    : item.name === o.name),
                        ) === i,
                );

            const itemUpdates: object[] = [];
            const itemRemovals: string[] = [];

            referenceItems.forEach((item) => {
                // Try to find a matching item on the actor
                const matchingItem = actor.items.find(
                    (o) =>
                        item.type === o.type &&
                        (item.hasId() && o.hasId()
                            ? item.system.id === o.system.id
                            : item.name === o.name),
                );
                if (!matchingItem) return;

                if (this.reduceQuantity && matchingItem.isPhysical()) {
                    // Calculate the new quantity
                    const newQuantity = Math.max(
                        matchingItem.system.quantity - this.amount,
                        0,
                    );

                    // If the new quantity is 0, remove the item
                    if (newQuantity === 0) {
                        itemRemovals.push(matchingItem.id);
                    } else {
                        // Otherwise, update the item quantity
                        itemUpdates.push({
                            _id: matchingItem.id,
                            'system.quantity': newQuantity,
                        });
                    }
                } else {
                    // Remove the item outright
                    itemRemovals.push(matchingItem.id);
                }
            });

            // Remove the items from the actor
            await Promise.all([
                actor.deleteEmbeddedDocuments('Item', itemRemovals, event.op),
                actor.updateEmbeddedDocuments('Item', itemUpdates, event.op),
            ]);
        },
    });
}
