import { CosmereItem } from '@system/documents';

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
            choices: Object.keys(CONFIG.COSMERE.damageTypes),
        }),
        skill: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.skills),
        }),
        attribute: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.attributes),
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
