// Fields
import { CollectionField } from '@system/data/fields/collection';
import { PseudoDocumentField } from '@system/data/fields/pseudo-document';

// Pseudo documents
import { PseudoItem } from '@system/documents/pseudo/item';

const SCHEMA = () => ({
    pseudoCollections: new foundry.data.fields.SchemaField({
        [Item.documentName]: new CollectionField(
            new PseudoDocumentField(PseudoItem),
        ),
    }),
});

export type PseudoCollectionsDataSchema = ReturnType<typeof SCHEMA>;
export type PseudoCollectionsData =
    foundry.data.fields.SchemaField.InitializedData<PseudoCollectionsDataSchema>;

export function PseudoCollectionsMixin<
    TParent extends foundry.abstract.Document.Any,
>() {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<PseudoCollectionsDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(
                    super.defineSchema(),
                    SCHEMA(),
                );
            }
        };
    };
}
