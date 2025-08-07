import { CosmereItem } from '@system/documents/item';

// Fields
import { ItemRelationshipField } from './field';
import { CollectionField } from '@system/data/fields/collection';

const SCHEMA = {
    relationships: new CollectionField(
        new ItemRelationshipField(),
        {
            required: true,
        },
    ),
};

export type RelationshipsItemDataSchema = typeof SCHEMA;
export type RelationshipsItemData = foundry.data.fields.SchemaField.InitializedData<RelationshipsItemDataSchema>;

/**
 * Mixin for items to track relationships with other items.
 * For example, a talent will have a relationship with its path.
 */
export function RelationshipsMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<RelationshipsItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
            }
        };
    };
}

export { ItemRelationship, ItemRelationshipData } from './data-model';
