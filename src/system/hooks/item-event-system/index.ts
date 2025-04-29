import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { EventsItemData } from '@system/data/item/mixins/events';

import { Event, EventType } from '@system/types/item/events';

export { register as registerHandlers } from './handlers';

import { SYSTEM_ID } from '@system/constants';

Hooks.on(
    'createItem',
    async (item: CosmereItem, options: { parent: CosmereActor | null }) => {
        // Check if the item has events
        if (!item.hasEvents()) return;

        // Fire events
        await fireEvent({ type: EventType.Create, item });
        if (options.parent)
            await fireEvent({
                type: EventType.AddToActor,
                item,
                actor: options.parent,
            });
    },
);

async function fireEvent(event: Event) {
    // Get the item
    const item = event.item as CosmereItem<EventsItemData>;

    await item.system.events
        .filter((rule) => rule.event === event.type)
        .sort((a, b) => a.order - b.order)
        .reduce(async (prev, rule) => {
            if ((await prev) === false) return false;

            try {
                // Execute the rule
                return await rule.handler.execute(event);
            } catch (e) {
                console.error(
                    `[${SYSTEM_ID}] Error executing event rule ${rule.id} for item ${item.name}`,
                    e,
                );
            }
        }, Promise.resolve<void | boolean>(undefined));
}
