import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemEventTypeConfig } from '@system/types/config';
import { RestType } from '@system/types/cosmere';

import { DeepPartial } from '@system/types/utils';

// Constants
import { HOOKS } from '@system/constants/hooks';

type EventDefinition = Omit<ItemEventTypeConfig, 'label' | 'host'> &
    Partial<Pick<ItemEventTypeConfig, 'host'>> & {
        type: string;
    };

const EVENTS: EventDefinition[] = [
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
    {
        type: 'equip',
        hook: 'updateItem',
        condition: (_: CosmereItem, change: DeepPartial<CosmereItem>) => {
            return (
                foundry.utils.getProperty(change, 'system.equipped') === true
            );
        },
    },
    {
        type: 'unequip',
        hook: 'updateItem',
        condition: (_: CosmereItem, change: DeepPartial<CosmereItem>) => {
            return (
                foundry.utils.getProperty(change, 'system.equipped') === false
            );
        },
    },
    { type: 'use', hook: HOOKS.USE_ITEM },
    { type: 'mode-activate', hook: HOOKS.MODE_ACTIVATE_ITEM },
    { type: 'mode-deactivate', hook: HOOKS.MODE_DEACTIVATE_ITEM },

    // General Actor events
    { type: 'update-actor', hook: 'updateActor' },
    {
        type: 'apply-damage-actor',
        hook: HOOKS.APPLY_DAMAGE,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'apply-injury-actor',
        hook: HOOKS.APPLY_INJURY,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'short-rest-actor',
        hook: HOOKS.REST,
        condition: (_: CosmereActor, duration: RestType) =>
            duration === RestType.Short,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'long-rest-actor',
        hook: HOOKS.REST,
        condition: (_: CosmereActor, duration: RestType) =>
            duration === RestType.Long,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
];

export function registerEventTypes() {
    EVENTS.forEach(({ type, hook, host, condition, transform }) => {
        cosmereRPG.api.registerItemEventType({
            type,
            hook,
            host,
            condition,
            transform,
            label: `COSMERE.Item.EventSystem.Event.Types.${type}.Label`,
        });
    });
}
