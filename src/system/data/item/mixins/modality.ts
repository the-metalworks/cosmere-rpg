import { CosmereItem } from '@system/documents';
import { IdItemData } from './id';

const SCHEMA = () => ({
    modality: new foundry.data.fields.StringField({
        required: true,
        nullable: true,
        label: 'COSMERE.Item.Modality.Label',
        hint: 'COSMERE.Item.Modality.Hint',
        initial: null,
    }),
});

export type ModalityItemDataSchema = ReturnType<typeof SCHEMA>;
export type ModalityItemData = foundry.data.fields.SchemaField.InitializedData<ModalityItemDataSchema>;

export function ModalityItemMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<ModalityItemDataSchema, TParent> {
            static defineSchema() {
                const superSchema = super.defineSchema();

                // Ensure schema contains id (id mixin was used)
                if (!('id' in superSchema)) {
                    throw new Error(
                        'ModalityItemMixin must be used in combination with IdItemMixin',
                    );
                }

                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
            }
        };
    };
}
