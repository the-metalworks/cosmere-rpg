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