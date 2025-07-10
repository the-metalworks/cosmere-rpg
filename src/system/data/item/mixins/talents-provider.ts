import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';

export interface TalentsProviderData {
    /**
     * The UUID of the talent tree that gets displayed on the talents tab.
     */
    talentTree: string | null;

    getTalents(includeNested?: boolean): Promise<TalentItem[]>;
    providesTalent(talent: TalentItem): Promise<boolean>;
    providesTalent(id: string): Promise<boolean>;
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

            public async getTalents(
                includeNested = true,
            ): Promise<TalentItem[]> {
                if (!this.talentTree) return [];

                // Get the talent tree item
                const talentTreeItem = (await fromUuid(
                    this.talentTree,
                )) as TalentTreeItem | null;
                if (!talentTreeItem?.isTalentTree()) return [];

                // Get all talents from the talent tree
                return talentTreeItem.system.getTalents(includeNested);
            }

            public async providesTalent(talent: TalentItem): Promise<boolean>;
            public async providesTalent(id: string): Promise<boolean>;
            public async providesTalent(
                talentOrId: TalentItem | string,
            ): Promise<boolean> {
                // Get talents
                const talents = await this.getTalents();

                // Get the id of the talent
                const id =
                    typeof talentOrId === 'string'
                        ? talentOrId
                        : talentOrId.system.id;

                // Check if any talent matches the id
                return talents.some((talent) => {
                    return talent.system.id === id;
                });
            }
        };
    };
}
