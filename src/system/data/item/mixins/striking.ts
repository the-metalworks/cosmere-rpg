import { DamageType, DieSize, Skill } from '@src/system/types/cosmere';

const SCHEMA = () => ({
    strike: new foundry.data.fields.SchemaField({
        die: new foundry.data.fields.SchemaField({
            size: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                initial: DieSize.D4,
                choices: () => Object.values(DieSize),
            }),
            count: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                integer: true,
                step: 1,
                min: 1,
            }),
        }),
        damageType: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            initial: DamageType.Keen,
            choices: Object.keys(CONFIG.COSMERE.damageTypes) as DamageType[],
        }),
        skill: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            initial: Skill.LightWeapons,
            choices: Object.keys(CONFIG.COSMERE.skills) as Skill[],
        }),
        skillLocked: new foundry.data.fields.BooleanField({
            required: true,
            nullable: true,
            initial: true,
        }),
    }),
});

export type StrikingItemDataSchema = ReturnType<typeof SCHEMA>;

export function StrikingItemMixin<
    TParent extends foundry.abstract.Document.Any,
>() {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<StrikingItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(
                    super.defineSchema(),
                    SCHEMA(),
                );
            }
        };
    };
}
