import { CosmereItem } from '@system/documents/item';

// Data models
import { ItemRelationship } from './data-model';

// Fields
import { ItemRelationshipField } from './field';
import { CollectionField } from '@system/data/fields/collection';

export interface RelationshipsItemData {
    /**
     * A collection of relationships this item has with other items.
     * This is used to track the relationships between items, such as
     * talents that are granted by their path.
     */
    relationships: Collection<ItemRelationship>;
}

/**
 * Mixin for items to track relationships with other items.
 * For example, a talent will have a relationship with its path.
 */
export function RelationshipsMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<RelationshipsItemData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    relationships: new CollectionField(
                        new ItemRelationshipField(),
                        {
                            required: true,
                        },
                    ),
                });
            }
        };
    };
}

export { ItemRelationship } from './data-model';
export { ItemRelationshipData } from './types';
