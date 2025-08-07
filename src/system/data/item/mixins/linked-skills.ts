import { CosmereItem } from '@system/documents';

const SCHEMA = {
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
};

export type LinkedSkillsItemDataSchema = typeof SCHEMA;

export function LinkedSkillsMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<LinkedSkillsItemDataSchema, TParent>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
            }
        };
    };
}
