import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemEventTypeConfig } from '@system/types/config';
import { RestType } from '@system/types/cosmere';
import { Event } from '@system/types/item/event-system';

import { DeepPartial, AnyObject } from '@system/types/utils';

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

    // Item <-> Item events
    {
        type: 'add-to-item',
        hook: 'createItem',
        condition: (
            _: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) => !!options.parent && options.parent instanceof CosmereItem,
        filter: (item: CosmereItem) => item.isAction(),
    },
    {
        type: 'remove-from-item',
        hook: 'deleteItem',
        condition: (
            _: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) => !!options.parent && options.parent instanceof CosmereItem,
        filter: (item: CosmereItem) => item.isAction(),
    },
    {
        type: 'add-child-action',
        hook: 'createItem',
        condition: (
            item: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) =>
            item.isAction() &&
            !!options.parent &&
            options.parent instanceof CosmereItem,
        filter: (item: CosmereItem) => item.isActivatable,
        transform: (item: CosmereItem, options: AnyObject) => ({
            document: item.parent!,
            options: foundry.utils.mergeObject(options, {
                child: item,
            }),
        }),
    },
    {
        type: 'remove-child-action',
        hook: 'deleteItem',
        condition: (
            item: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) =>
            item.isAction() &&
            !!options.parent &&
            options.parent instanceof CosmereItem,
        filter: (item: CosmereItem) => item.isActivatable,
        transform: (item: CosmereItem, options: AnyObject) => ({
            document: item.parent!,
            options: foundry.utils.mergeObject(options, {
                child: item,
            }),
        }),
    },

    // Item <-> Actor events
    {
        type: 'add-to-actor',
        hook: 'createItem',
        condition: (
            _: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) => !!options.parent && options.parent instanceof CosmereActor,
    },
    {
        type: 'remove-from-actor',
        hook: 'deleteItem',
        condition: (
            _: CosmereItem,
            options: { parent: CosmereActor | CosmereItem | null },
        ) => !!options.parent && options.parent instanceof CosmereActor,
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

    // Item usage
    {
        type: 'use', // Triggered when this action is used
        hook: HOOKS.USE_ITEM,
        filter: (item: CosmereItem) => item.isAction(),
    },
    {
        type: 'use-action', // Triggered when any of this item's actions are used (embedded actions)
        hook: HOOKS.USE_ITEM,
        filter: (item: CosmereItem) => item.isActivatable && !item.isAction(),
        transform: (item: CosmereItem) => ({ document: item.root }),
        condition: (item: CosmereItem) => item.isAction(),
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
