import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemEventTypeConfig } from '@system/types/config';
import { RestType } from '@system/types/cosmere';

import { DeepPartial } from '@system/types/utils';

// Hooks
import * as CosmereHooks from '../definition';

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
    { type: 'use', hook: CosmereHooks.UseItem },
    { type: 'mode-activate', hook: CosmereHooks.ModeActivateItem },
    { type: 'mode-deactivate', hook: CosmereHooks.ModeDeactivateItem },

    // General Actor events
    { type: 'update-actor', hook: 'updateActor' },
    {
        type: 'apply-damage-actor',
        hook: CosmereHooks.PostApplyDamage,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'apply-injury-actor',
        hook: CosmereHooks.PostApplyInjury,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'short-rest-actor',
        hook: CosmereHooks.PostRest,
        condition: (_: CosmereActor, duration: RestType) =>
            duration === RestType.Short,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
    {
        type: 'long-rest-actor',
        hook: CosmereHooks.PostRest,
        condition: (_: CosmereActor, duration: RestType) =>
            duration === RestType.Long,
        transform: (actor: CosmereActor) => ({ document: actor }),
    },
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
