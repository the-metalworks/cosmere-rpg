import { DamageType } from '@system/types/cosmere';

// Fields
import { SkillField } from '@system/data/fields/skill-field';
import { AttributeField } from '@system/data/fields/attribute-field';

export class DamageField extends foundry.data.fields.SchemaField<
    DamageField.Schema,
    DamageField.Options
> {
    constructor(
        options?: DamageField.Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(DamageField.defineSchema(), options, context);
    }

    public static defineSchema() {
        return {
            formula: new foundry.data.fields.StringField({
                nullable: true,
                blank: false,
            }),
            grazeOverrideFormula: new foundry.data.fields.StringField({
                nullable: true,
            }),
            type: new foundry.data.fields.StringField({
                nullable: true,
                choices: Object.keys(
                    CONFIG.COSMERE.damageTypes,
                ) as DamageType[],
            }),
            skill: new SkillField({
                nullable: true,
                noneable: true,
                includeDefault: true,
                initial: 'default',
            }),
            attribute: new AttributeField({
                nullable: true,
                noneable: true,
                includeDefault: true,
                initial: 'default',
            }),
        };
    }
}

export namespace DamageField {
    export type Schema = ReturnType<typeof DamageField.defineSchema>;

    export type Options =
        foundry.data.fields.SchemaField.Options<DamageField.Schema>;
}
