import { ItemType } from '@system/types/cosmere';

export enum ItemRelationshipType {
    Parent = 'parent',
    Child = 'child',
}

export const enum ItemRelationshipRemovalPolicy {
    /**
     * The child item is removed when the parent item is removed.
     */
    Remove = 'remove',

    /**
     * The child item is kept when the parent item is removed.
     */
    Keep = 'keep',
}

export interface ItemRelationshipData {
    /**
     * The id of the relationship.
     * This is a unique identifier for the relationship, not the item itself.
     * The id is the same between the parent and child items.
     */
    id: string;

    /**
     * The type of relationship this item has with the related item
     */
    type: ItemRelationshipType;

    /**
     * The uuid of the related item.
     */
    uuid: string;

    /**
     * The type of the related item.
     */
    itemType: ItemType;

    /**
     * What happens to the child item when the parent item is removed.
     *
     * @default ItemRelationship.RemovalPolicy.Keep
     */
    removalPolicy?: ItemRelationshipRemovalPolicy;
}
