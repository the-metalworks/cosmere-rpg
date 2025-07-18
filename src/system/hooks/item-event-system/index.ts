import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';

import { Event } from '@system/types/item/event-system';
import { ItemEventTypeConfig } from '@system/types/config';
import { AnyObject } from '@system/types/utils';

import { registerEventTypes } from './events';
import { registerHandlers } from './handlers';

import { InvalidHookError } from './errors';

// Constants
import { SYSTEM_ID } from '@system/constants';

const VALID_DOCUMENT_TYPES = [
    CONFIG.Item.documentClass.metadata.name,
    CONFIG.Actor.documentClass.metadata.name,
];

/**
 * The maximum depth of chained events.
 * If an event is fired that exceeds this depth,
 * an error will be thrown and the event will not be executed.
 */
const MAX_EVENT_CHAIN_DEPTH = 10;

/**
 * The maximum number of events that can be fired
 * in a short period of time.
 * If this limit is exceeded an error will be thrown
 * and the event will not be executed.
 */
const MAX_RECENT_EVENTS = 1000;

/**
 * The time in milliseconds that an event is considered
 * recent. If an event is fired within this time, it will
 * be counted as a recent event for the purposes of
 * preventing infinite loops.
 */
const RECENT_EVENT_TIMEOUT = 200; // ms

/**
 * Flag to toggle the event system.
 *
 * This lets systems, like migration, operate without
 * hitting the recent events limit and unintentionally
 * triggering the infinite loop detection.
 */
let PROCESS_EVENTS = true;

// Expose system toggles
export namespace EventSystem {
    // Enable the entire event system
    export function enable() {
        PROCESS_EVENTS = true;
    }

    // Disable the entire event system
    export function disable() {
        PROCESS_EVENTS = false;
    }
}

// Global variables
let lastEventTime = 0;
const recentEventOfTypeCounts: Record<string, number> = {};

export function register() {
    // Register event types
    registerEventTypes();

    // Register event handlers
    registerHandlers();
}

Hooks.once('ready', () => {
    // Group all item event types by their hook
    const evenTypesByHook: Record<string, string[]> = Object.entries(
        CONFIG.COSMERE.items.events.types,
    ).reduce(
        (acc, [type, config]) => {
            if (!acc[config.hook]) {
                acc[config.hook] = [];
            }
            acc[config.hook].push(type);
            return acc;
        },
        {} as Record<string, string[]>,
    );

    // Register hooks for each event type
    Object.entries(evenTypesByHook).forEach(([hook, eventTypes]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Hooks.on(hook, async (...args: any[]) => {
            const freshTraceId = foundry.utils.randomID();
            const freshDepth = 0;

            // Trigger the events for this hook
            await eventTypes.reduce(async (prev, type) => {
                await prev;

                // Get the config for the event type
                const config = CONFIG.COSMERE.items.events.types[type];

                // Check condition
                if (config.condition && !(await config.condition(...args)))
                    return;

                // Transform hook arguments to useable format
                const {
                    document,
                    options,
                    userId: sourceUserId,
                } = getTransform(type, config)(...args);

                // Get event trace
                const trace = {
                    _eti: options?._eti ?? freshTraceId,
                    _d: options?._d ?? freshDepth,
                };

                // Increase depth
                trace._d++;

                if (
                    document.documentName ===
                    CONFIG.Actor.documentClass.metadata.name
                ) {
                    // Document is an actor
                    const actor = document as CosmereActor;

                    // Handle the hook for all items
                    await actor.items.reduce(async (prev, item) => {
                        // Wait for the previous item to finish
                        await prev;

                        // Handle the hook
                        return handleEventHook(
                            item,
                            type,
                            trace,
                            config,
                            options,
                            sourceUserId,
                        );
                    }, Promise.resolve());
                } else if (
                    document.documentName ===
                    CONFIG.Item.documentClass.metadata.name
                ) {
                    // Document is an item
                    const item = document as CosmereItem;

                    // Handle the hook
                    await handleEventHook(
                        item,
                        type,
                        trace,
                        config,
                        options,
                        sourceUserId,
                    );
                } else {
                    throw new InvalidHookError(
                        type,
                        config.hook,
                        `Document type must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}. Received: ${document.documentName}`,
                    );
                }
            }, Promise.resolve());
        });
    });
});

/* --- Helpers --- */

async function handleEventHook(
    item: CosmereItem,
    eventType: string,
    eventTrace: { _eti: string; _d: number },
    config: ItemEventTypeConfig,
    options?: AnyObject,
    sourceUserId?: string,
) {
    if (!PROCESS_EVENTS) return;

    // Verify if the local user is the appropriate event execution host
    if (!shouldHostEventExecution(item, sourceUserId, config.host)) return;

    // Ensure recent event counts are initialized
    recentEventOfTypeCounts[eventType] ??= 0;

    // Check for infinite loops
    preventInfiniteLoop(eventType, eventTrace);

    // Fire the event
    await fireEvent({ type: eventType, item, options, op: eventTrace });

    // Update the last event time
    lastEventTime = Date.now();
    recentEventOfTypeCounts[eventType]++;
}

function shouldHostEventExecution(
    item: CosmereItem,
    sourceUserId: string | undefined,
    host: Event.ExecutionHost,
) {
    if (host === Event.ExecutionHost.Owner) {
        // Get ownership
        const ownership = (item.actor ?? item).ownership;

        // Get the first owning non-gm user that is active
        const owningUserId = Object.entries(ownership)
            .filter(([id]) => id !== 'default')
            .find(([userId, ownershipLevel]) => {
                const user = (game.users as Collection<User>).get(userId);
                return (
                    !!user &&
                    user.active &&
                    !user.isGM &&
                    ownershipLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
                );
            })?.[0];

        // If an owning user is found, check if the current user is the owner
        if (owningUserId) return game.userId === owningUserId;

        // If no owning user is found, find an active GM user
        const gmUser = (game.users as Collection<User>).find(
            (user) => user.active && user.isGM,
        );

        return gmUser?.isSelf ?? false;
    } else if (host === Event.ExecutionHost.GM) {
        // Find an active GM user
        const gmUser = (game.users as Collection<User>).find(
            (user) => user.active && user.isGM,
        );
        return gmUser?.isSelf ?? false;
    } else if (host === Event.ExecutionHost.Source) {
        // Check if the source user is the current user
        return (
            !sourceUserId || // Assume the hook was triggered locally if no source user id is provided
            game.userId === sourceUserId
        );
    }
}

function preventInfiniteLoop(eventType: string, trace: { _d: number }) {
    // Check if the event chain depth exceeds the maximum allowed
    if (trace._d > MAX_EVENT_CHAIN_DEPTH) {
        ui.notifications.error(
            game.i18n!.localize(
                `COSMERE.Item.EventSystem.Notification.ExceededMaxDepth`,
            ),
        );

        throw new Error(
            `[${SYSTEM_ID}] Event chain depth exceeded the maximum allowed of ${MAX_EVENT_CHAIN_DEPTH}. Possible infinite loop detected.`,
        );
    }

    // Get the current time
    const now = Date.now();

    // Check if the time since the last event is less than the timeout
    if (now - lastEventTime >= RECENT_EVENT_TIMEOUT) {
        // Reset the recent event count
        recentEventOfTypeCounts[eventType] = 0;
        return;
    }

    // Check if the number of recent events is greater than the limit
    if (recentEventOfTypeCounts[eventType] >= MAX_RECENT_EVENTS) {
        ui.notifications.error(
            game.i18n!.format(
                `COSMERE.Item.EventSystem.Notification.RecentEventsExceeded`,
                {
                    eventType,
                },
            ),
        );

        throw new Error(
            `[${SYSTEM_ID}] Too many events fired in a short period of time. Possible infinite loop detected.`,
        );
    }
}

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
                return await rule.handler.execute(
                    foundry.utils.deepClone(event),
                );
            } catch (e) {
                console.error(
                    `[${SYSTEM_ID}] Error executing event rule ${rule.id} for item ${item.name} ${item.uuid}`,
                    e,
                );
            }
        }, Promise.resolve<void | boolean>(undefined));
}

function getTransform(type: string, config: ItemEventTypeConfig) {
    // NOTE: Must use `any` here as hooks can be called with arbitrary arguments
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
    return (
        config.transform ??
        ((...args: any[]) => {
            // Ensure first argument is a document
            if (!args[0] || !(args[0] instanceof foundry.abstract.Document)) {
                throw new InvalidHookError(
                    type,
                    config.hook,
                    'First argument must be a document.',
                );
            }

            // Get the document
            const document = args[0] as foundry.abstract.Document;

            // Grab options and source user id, if present
            const options =
                args.length > 1
                    ? args.length === 2
                        ? args[1] // If only two arguments, the second is options
                        : args[args.length - 2] // If more than two, the second to last is options
                    : undefined;
            const userId =
                args.length > 2
                    ? args[args.length - 1] // If more than two, the last is the source user id
                    : undefined;

            if (!!options && typeof options !== 'object') {
                throw new InvalidHookError(
                    type,
                    config.hook,
                    'Options must be an object.',
                );
            }

            if (!!userId && typeof userId !== 'string') {
                throw new InvalidHookError(
                    type,
                    config.hook,
                    'Source user id must be a string.',
                );
            }

            return {
                document,
                options,
                userId,
            } as {
                document: foundry.abstract.Document;
                options?: AnyObject & { _eti?: string; _d?: number };
                userId?: string;
            };
        })
    );
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
}
