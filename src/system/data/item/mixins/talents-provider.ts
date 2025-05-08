import { CosmereItem } from '@system/documents';

export interface TalentsProviderData {
    /**
     * The UUID of the talent tree that gets displayed on the talents tab.
     */
    talentTree: string | null;
}

/**
 * Mixin for items that provide a talent tree through the "talents" tab.
 * Used for Paths & Ancestries.
 */
export function TalentsProviderMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<TalentsProviderData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    talentTree: new foundry.data.fields.DocumentUUIDField({
                        required: true,
                        nullable: true,
                        blank: false,
                        initial: null,
                        label: 'COSMERE.Item.Sheet.TalentsProvider.TalentTree.Label',
                        hint: 'COSMERE.Item.Sheet.TalentsProvider.TalentTree.Hint',
                    }),
                });
            }
        };
    };
}
