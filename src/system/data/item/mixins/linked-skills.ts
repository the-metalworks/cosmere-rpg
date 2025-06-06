import { PathType, Skill } from '@system/types/cosmere';

import { CosmereItem } from '@system/documents';

export interface LinkedSkillsItemData {
    /**
     * The non-core skills linked to this item.
     * These skills are displayed with the item in the sheet.
     */
    linkedSkills: Skill[];
}

export function LinkedSkillsMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<LinkedSkillsItemData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    linkedSkills: new foundry.data.fields.ArrayField(
                        new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                            choices: () =>
                                Object.entries(CONFIG.COSMERE.skills)
                                    .filter(([key, skill]) => !skill.core)
                                    .reduce(
                                        (acc, [key, skill]) => ({
                                            ...acc,
                                            [key]: skill.label,
                                        }),
                                        {},
                                    ),
                        }),
                        {
                            required: true,
                            nullable: false,
                            initial: [],
                            label: 'COSMERE.Item.General.LinkedSkills.Label',
                            hint: 'COSMERE.Item.General.LinkedSkills.Hint',
                        },
                    ),
                });
            }
        };
    };
}
