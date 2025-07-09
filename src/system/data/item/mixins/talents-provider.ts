import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';

// Mixins
import { IdItemData } from './id';

// Types
import { Talent } from '@system/types/item';

// Constants
import { SYSTEM_ID } from '@system/constants';

export interface TalentsProviderData {
    /**
     * The UUID of the talent tree that gets displayed on the talents tab.
     */
    talentTree: string | null;

    readonly unlockedTalents: TalentItem[];

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
        base: typeof foundry.abstract.TypeDataModel<
            TalentsProviderData & IdItemData,
            P
        >,
    ) => {
        return class extends base {
            static defineSchema() {
                const superSchema = super.defineSchema();

                // Ensure schema contains id (id mixin was used)
                if (!('id' in superSchema)) {
                    throw new Error(
                        'TalentsProviderMixin must be used in combination with IdItemMixin',
                    );
                }

                return foundry.utils.mergeObject(superSchema, {
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

            /**
             * The talents that the actor has unlocked from this item.
             */
            public get unlockedTalents(): TalentItem[] {
                if (!this.parent.actor) return [];

                // Get the actor
                const actor = this.parent.actor;

                // Get all talents whose source is this item
                return actor.talents.filter((talent) => {
                    // Get the source
                    const source = talent.getFlag(
                        SYSTEM_ID,
                        'source',
                    ) as Talent.Source | null;

                    // Ensure the source type matches the type of this item
                    const sourceTypeMatch =
                        (source?.type === Talent.SourceType.Ancestry &&
                            this.parent.isAncestry()) ||
                        (source?.type === Talent.SourceType.Path &&
                            this.parent.isPath()) ||
                        (source?.type === Talent.SourceType.Power &&
                            this.parent.isPower());

                    // Ensure the source id matches the id of this item
                    return (
                        (sourceTypeMatch &&
                            source.id === this.parent.system.id) ||
                        (source?.type === Talent.SourceType.Tree &&
                            source.uuid === this.talentTree)
                    );
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
