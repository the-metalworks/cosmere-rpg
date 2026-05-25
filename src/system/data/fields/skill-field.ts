import type { Skill } from '@system/types/cosmere';

export class SkillField<
    const Options extends SkillField.Options = SkillField.DefaultOptions,
    const AssignmentType = SkillField.AssignmentType<Options>,
    const InitializedType = SkillField.InitializedType<Options>,
    const PersistedType extends
        | Skill
        | 'none'
        | 'default'
        | null
        | undefined = SkillField.InitializedType<Options>,
> extends foundry.data.fields.StringField<
    foundry.data.fields.StringField.Options<SkillField.ValidChoice<Options>>,
    AssignmentType,
    InitializedType,
    PersistedType
> {
    constructor(
        options?: Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(
            foundry.utils.mergeObject(
                {
                    label: 'GENERIC.Skill',
                },
                foundry.utils.mergeObject(options ?? {}, {
                    choices: {
                        ...(options?.includeDefault
                            ? { default: 'GENERIC.Default' }
                            : {}),
                        ...(options?.noneable ? { none: 'GENERIC.None' } : {}),
                        ...Object.entries(CONFIG.COSMERE.skills).reduce(
                            (acc, [key, config]) => ({
                                ...acc,
                                [key]: config.label,
                            }),
                            {} as Record<Skill, string>,
                        ),
                    },
                    coerce: (value: unknown) => (value === '' ? null : value),
                }),
            ),
            context,
        );
    }
}

export namespace SkillField {
    export type Options = foundry.data.fields.DataField.Options<
        Skill | 'none' | 'default'
    > & {
        /**
         * Whether to include a "None" option (with value `none`) in the choices.
         *
         * @default false
         */
        noneable?: boolean;

        /**
         * Whether to include a "Default" option (with value `default`) in the choices.
         *
         * @default false
         */
        includeDefault?: boolean;
    };

    export type DefaultOptions =
        foundry.data.fields.DataField.DefaultOptions & {
            noneable: false;
            includeDefault: false;
        };

    export type ValidChoice<Options extends SkillField.Options> =
        | (Options['noneable'] extends true ? 'none' : never)
        | (Options['includeDefault'] extends true ? 'default' : never)
        | Skill;

    export type AssignmentType<Options extends SkillField.Options> =
        foundry.data.fields.DataField.DerivedAssignmentType<
            ValidChoice<Options>,
            Options
        >;

    export type InitializedType<Options extends SkillField.Options> =
        foundry.data.fields.DataField.DerivedInitializedType<
            ValidChoice<Options>,
            Options
        >;
}
