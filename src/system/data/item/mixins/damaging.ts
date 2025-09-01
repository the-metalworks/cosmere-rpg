import { CosmereItem } from '@system/documents';
import { Skill, Attribute, DamageType } from '@system/types/cosmere';

const SCHEMA = {
    damage: new foundry.data.fields.SchemaField({
        formula: new foundry.data.fields.StringField({
            nullable: true,
            blank: false,
        }),
        grazeOverrideFormula:
            new foundry.data.fields.StringField({
                nullable: true,
            }),
        type: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.damageTypes) as DamageType[],
        }),
        skill: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.skills) as Skill[],
        }),
        attribute: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.attributes) as Attribute[],
        }),
    }),
};

export type DamagingItemDataSchema = typeof SCHEMA;
export type DamagingItemData = foundry.data.fields.SchemaField.InitializedData<DamagingItemDataSchema>;

export function DamagingItemMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<DamagingItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
            }
        };
    };
}
