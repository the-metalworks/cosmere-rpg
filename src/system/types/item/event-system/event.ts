import { CosmereItem } from '@system/documents/item';
import { AnyMutableObject } from '@system/types/utils';

export type Event<
    EventData extends AnyMutableObject = AnyMutableObject,
    T extends string = string,
> = {
    /**
     * The type of this event.
     */
    type: T;

    /**
     * The item that triggered this event.
     */
    item: CosmereItem;
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
}
