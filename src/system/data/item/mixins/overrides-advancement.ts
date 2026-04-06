import * as Advancement from '@system/types/advancement';

const SCHEMA = () => ({
    advancement: new foundry.data.fields.SchemaField({
        overrides: new foundry.data.fields.ArrayField(
            new foundry.data.fields.SchemaField({
                level: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0,
                }),
                type: new foundry.data.fields.StringField({
                    required: true,
                    choices: [
                        Advancement.OverrideType.Generic,
                        Advancement.OverrideType.Maximum,
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
                        .concat(Object.values(Advancement.GenericFieldKey))
                        .concat(Object.values(Advancement.MaxStatFieldKey)),
                }),
                stat: new foundry.data.fields.StringField({
                    required: false,
                    choices: ([] as string[])
                        .concat(Object.keys(CONFIG.COSMERE.attributes))
                        .concat(Object.keys(CONFIG.COSMERE.skills)),
                }),
                value: new foundry.data.fields.AnyField(),
            }),
        ),
    }),
});

export type OverridesAdvancementDataSchema = ReturnType<typeof SCHEMA>;

export type OverridesAdvancementData =
    foundry.data.fields.SchemaField.InitializedData<OverridesAdvancementDataSchema>;

export type ItemOverrideData =
    OverridesAdvancementData['advancement']['overrides'][number];

// NOTE: Have to explicitly use a type here instead of an interface to comply with DataSchema type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type OverridesAdvancementDerivedData = {
    getOverridesAtLevel(level: number): ItemOverrideData[];
};

export function OverridesAdvancementMixin<
    TParent extends foundry.abstract.Document.Any,
>() {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<OverridesAdvancementDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(
                    super.defineSchema(),
                    SCHEMA(),
                );
            }

            public getOverridesAtLevel(level: number): ItemOverrideData[] {
                return this.advancement.overrides.filter(
                    (override) => override.level === level,
                );
            }
        };
    };
}
