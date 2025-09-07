const SCHEMA = () => ({
    key: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: '',
    }),
    value: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: '',
    }),
    mode: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        initial: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        choices: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [value]: `EFFECT.MODE_${key}`,
            }),
            {},
        ),
    }),
});

export type ChangeDataSchema = ReturnType<typeof SCHEMA>;
export type ChangeData = foundry.data.fields.SchemaField.InitializedData<ChangeDataSchema>;

export class ChangeDataModel extends foundry.abstract.DataModel<ChangeDataSchema> {
    static defineSchema() {
        return SCHEMA();
    }
}
