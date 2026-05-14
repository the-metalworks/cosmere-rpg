import { Advancement } from '@system/types/advancement';

const SCHEMA = () => ({
    id: new foundry.data.fields.StringField({
        initial: () => foundry.utils.randomID(),
        required: true,
        blank: false,
    }),
    priority: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        nullable: false,
        initial: 0,
    }),
    source: new foundry.data.fields.DocumentUUIDField({
        type: 'Item',
    }),
    levels: new foundry.data.fields.SchemaField({
        min: new foundry.data.fields.NumberField({
            required: false,
            integer: true,
            positive: true,
            nullable: false,
        }),
        max: new foundry.data.fields.NumberField({
            required: false,
            integer: true,
            positive: true,
            nullable: false,
        }),
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
        choices: ['base']
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
