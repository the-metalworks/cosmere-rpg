import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemEventTypeConfig } from '@system/types/config';
import { RestType } from '@system/types/cosmere';
import { Event } from '@system/types/item/event-system';

import { DeepPartial } from '@system/types/utils';

// Constants
import { HOOKS } from '@system/constants/hooks';
import { SYSTEM_ID } from '@src/system/constants';

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
        filter: (item: CosmereItem) => item.isEquippable(),
        condition: (_: CosmereItem, change: DeepPartial<CosmereItem>) => {
            return (
                foundry.utils.getProperty(change, 'system.equipped') === true
            );
        },
    },
    {
        type: 'unequip',
        hook: 'updateItem',
        filter: (item: CosmereItem) => item.isEquippable(),
        condition: (_: CosmereItem, change: DeepPartial<CosmereItem>) => {
            return (
                foundry.utils.getProperty(change, 'system.equipped') === false
            );
        },
    },
    {
        type: 'use',
        hook: HOOKS.USE_ITEM,
        filter: (item: CosmereItem) => item.hasActivation(),
    },
    {
        type: 'mode-activate',
        hook: HOOKS.MODE_ACTIVATE_ITEM,
        filter: (item: CosmereItem) => item.hasModality(),
    },
    {
        type: 'mode-deactivate',
        hook: HOOKS.MODE_DEACTIVATE_ITEM,
        filter: (item: CosmereItem) => item.hasModality(),
    },
    {
        type: 'goal-complete',
        hook: HOOKS.COMPLETE_GOAL,
        filter: (item: CosmereItem) => item.isGoal(),
    },
    {
        type: 'goal-progress',
        hook: HOOKS.PROGRESS_GOAL,
        filter: (item: CosmereItem) => item.isGoal(),
    },

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
    EVENTS.forEach(({ type, hook, host, filter, condition, transform }) => {
        cosmereRPG.api.registerItemEventType({
            source: SYSTEM_ID,
            type,
            hook,
            host,
            filter,
            condition,
            transform,
            label: `COSMERE.Item.EventSystem.Event.Types.${type}.Label`,
            description: `COSMERE.Item.EventSystem.Event.Types.${type}.Description`,
        });
    });
}
