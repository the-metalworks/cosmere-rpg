import { Skill, Attribute, DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

export interface DamagingItemData {
    damage: {
        formula?: string;
        type?: DamageType;
        grazeOverrideFormula?: string;
        skill?: Skill;
        attribute?: Attribute;
    };
}

export function DamagingItemMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<DamagingItemData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
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
                });
            }
        };
    };
}
