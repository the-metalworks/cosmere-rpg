import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';

import { Event } from '@system/types/item/events';

import { registerEventTypes } from './events';
import { registerHandlers } from './handlers';

// Constants
import { SYSTEM_ID } from '@system/constants';

export function register() {
    // Register event types
    registerEventTypes();

    // Register event handlers
    registerHandlers();
}

Hooks.once('ready', () => {
    Object.entries(CONFIG.COSMERE.items.events.types).forEach(
        ([type, config]) => {
            Hooks.on(
                config.hook,
                (
                    item: CosmereItem,
                    ...rest: [
                        ...unknown[],
                        { parent: CosmereActor | null },
                        string,
                    ]
                ) => {
                    // Validate
                    if (!item || !(item instanceof CosmereItem)) {
                        console.error(
                            `[${SYSTEM_ID}] Invalid hook "${config.hook}" for event "${type}". Hook must pass item as first parameter. Received:`,
                            item,
                        );
                        return;
                    }

                    // Check condition
                    if (config.condition && !config.condition(item, ...rest))
                        return;

                    // Get the options
                    const id = rest.pop() as string;
                    const options = rest.pop() as {
                        parent: CosmereActor | null;
                    };

                    // Fire the event
                    void fireEvent({ type, item, actor: options.parent });
                },
            );
        },
    );
});

/* --- Helpers --- */

async function fireEvent(event: Event) {
    const { item } = event;

    // Check if the item has events
    if (!item.hasEvents()) return;

    // Execute any relevant rules
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
