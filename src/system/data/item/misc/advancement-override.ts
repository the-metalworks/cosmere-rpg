import * as Advancement from '@system/types/advancement';

const SCHEMA = () => ({
    priority: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        nullable: false,
        initial: 0,
    }),
    source: new foundry.data.fields.DocumentUUIDField({
        type: 'Item',
    }),
    level: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        nullable: false,
        min: 1,
        initial: 1,
    }),
    type: new foundry.data.fields.StringField({
        required: true,
        choices: [
            Advancement.OverrideType.Grants,
            Advancement.OverrideType.MaxStat,
        ],
    }),
    mode: new foundry.data.fields.StringField({
        required: true,
        choices: [
            Advancement.OverrideMode.Absolute,
            Advancement.OverrideMode.Relative,
        ],
    }),
    key: new foundry.data.fields.StringField({
        required: true,
        choices: ([] as string[])
            .concat(Object.values(Advancement.GrantsFieldKey))
            .concat(Object.values(Advancement.MaxStatFieldKey)),
    }),
    stat: new foundry.data.fields.StringField({
        required: false,
        choices: ([] as string[])
            .concat(Object.keys(CONFIG.COSMERE.attributes))
            .concat(Object.keys(CONFIG.COSMERE.skills)),
    }),
    value: new foundry.data.fields.AnyField(),
});

export type AdvancementOverrideDataSchema = ReturnType<typeof SCHEMA>;
export type AdvancementOverrideData =
    foundry.data.fields.SchemaField.InitializedData<AdvancementOverrideDataSchema>;

export class AdvancementOverrideDataModel extends foundry.abstract
    .DataModel<AdvancementOverrideDataSchema> {
    static defineSchema() {
        return SCHEMA();
    }
}
