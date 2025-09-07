import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { MustBeValidUuid } from '@system/types/utils';

const SCHEMA = () => ({
    talentTree: new foundry.data.fields.DocumentUUIDField<
        foundry.data.fields.DocumentUUIDField.Options,
        string | undefined | null,
        MustBeValidUuid<string>
    >({
        required: true,
        nullable: true,
        blank: false,
        initial: null,
        type: 'Item',
        label: 'COSMERE.Item.Sheet.TalentsProvider.TalentTree.Label',
        hint: 'COSMERE.Item.Sheet.TalentsProvider.TalentTree.Hint',
    }),
});

export type TalentsProviderDataSchema = ReturnType<typeof SCHEMA>;
export type TalentsProviderData = foundry.data.fields.SchemaField.InitializedData<TalentsProviderDataSchema>;
export type TalentsProviderDerivedData = {
    providesTalent(talent: TalentItem): Promise<boolean>;
    providesTalent(id: string): Promise<boolean>;
}

/**
 * Mixin for items that provide a talent tree through the "talents" tab.
 * Used for Paths & Ancestries.
 */
export function TalentsProviderMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<TalentsProviderDataSchema, TParent>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
            }

            public async getTalents(
                includeNested = true,
            ): Promise<TalentItem[]> {
                if (!this.talentTree) return [];

                // Get the talent tree item
                const talentTreeItem = (await fromUuid(
                    this.talentTree ,
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
