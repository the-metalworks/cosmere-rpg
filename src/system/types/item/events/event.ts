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
