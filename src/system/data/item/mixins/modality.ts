import { CosmereItem } from '@system/documents';
import { IdItemData } from './id';

export interface ModalityItemData {
    /**
     * The id of the modality this item belongs to. (i.e. "stance")
     */
    modality: string | null;
}

export function ModalityItemMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<
            ModalityItemData & IdItemData,
            P
        >,
    ) => {
        return class extends base {
            static defineSchema() {
                const superSchema = super.defineSchema();

                // Ensure schema contains id (id mixin was used)
                if (!('id' in superSchema)) {
                    throw new Error(
                        'ModalityItemMixin must be used in combination with IdItemMixin',
                    );
                }

                return foundry.utils.mergeObject(super.defineSchema(), {
                    modality: new foundry.data.fields.StringField({
                        required: true,
                        nullable: true,
                        label: 'COSMERE.Item.Modality.Label',
                        hint: 'COSMERE.Item.Modality.Hint',
                        initial: null,
                    }),
                });
            }
        };
    };
}
