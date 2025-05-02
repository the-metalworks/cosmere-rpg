import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemEventTypeConfig } from '@system/types/config';

const EVENTS: (Omit<ItemEventTypeConfig, 'label'> & { type: string })[] = [
    // General CRUD operations
    { type: 'create', hook: 'createItem' },
    { type: 'update', hook: 'updateItem' },
    { type: 'delete', hook: 'deleteItem' },

    // Item <-> Actor events
    {
        type: 'add-to-actor',
        hook: 'createItem',
        condition: (_: CosmereItem, options: { parent: CosmereActor | null }) =>
            !!options.parent,
    },
    {
        type: 'remove-from-actor',
        hook: 'deleteItem',
        condition: (_: CosmereItem, options: { parent: CosmereActor | null }) =>
            !!options.parent,
    },
    // Equip = 'equip',
    // Unequip = 'unequip',
    // Use = 'use',
    // ModeActivate = 'mode-activate', // Only for items that have a modality (e.g. stances)
    // ModeDeactivate = 'mode-deactivate',
];

export function registerEventTypes() {
    EVENTS.forEach(({ type, hook, host, condition }) => {
        cosmereRPG.api.registerItemEventType({
            type,
            hook,
            host,
            condition,
            label: `COSMERE.Item.Events.Type.${type}`,
        });
    });
}
