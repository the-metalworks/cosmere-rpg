import { ItemType } from '@system/types/cosmere';

export interface ItemOrigin {
    /**
     * The type of the item that is the origin.
     */
    type: ItemType;

    /**
     * The system identifier of the item that is the origin.
     */
    id: string;
}
