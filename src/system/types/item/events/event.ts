import { CosmereItem } from '@system/documents/item';
import { AnyMutableObject } from '@system/types/utils';

export enum EventType {
    // General CRUD operations
    Create = 'create',
    Update = 'update',
    Delete = 'delete',

    // Item <-> Actor events
    AddToActor = 'add-to-actor',
    RemoveFromActor = 'remove-from-actor',
    Equip = 'equip',
    Unequip = 'unequip',
    Use = 'use',
    ModeActivate = 'mode-activate', // Only for items that have a modality (e.g. stances)
    ModeDeactivate = 'mode-deactivate',
}

export type Event<
    EventData extends AnyMutableObject = AnyMutableObject,
    T extends EventType = EventType,
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
