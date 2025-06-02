export interface ChangeData {
    key: string;
    value: string;
    mode: number;
}

export class ChangeDataModel extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
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
        };
    }
}
