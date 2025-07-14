import { CosmereItem } from '@system/documents/item';
import { AnyMutableObject, AnyObject } from '@system/types/utils';

export type Event<
    EventData = AnyMutableObject,
    T extends string = string,
    TOptions extends object = AnyObject,
> = {
    /**
     * The type of this event.
     */
    type: T;

    /**
     * The item that triggered this event.
     */
    item: CosmereItem;

    /**
     * The event operation. Must be passed down to document operations.
     */
    op: AnyObject;

    options?: TOptions;
} & EventData;

export namespace Event {
    /**
     * Defines which user should host the event execution.
     * - `owner`: The item owner (default).
     * - `gm`: The GM.
     * - `source`: The source of the event (e.g. the user that triggered the event).
     */
    export const enum ExecutionHost {
        /**
         * The item owner (default).
         */
        Owner = 'owner',

        /**
         * The GM.
         */
        GM = 'gm',

        /**
         * The source of the event (e.g. the user that triggered the event).
         */
        Source = 'source',
    }

    export type UseItem = Event<unknown, 'use', CosmereItem.UseOptions>;
}
