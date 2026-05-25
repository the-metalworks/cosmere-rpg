import type { Attribute } from '@system/types/cosmere';

export class AttributeField<
    const Options extends
        AttributeField.Options = AttributeField.DefaultOptions,
    const AssignmentType = AttributeField.AssignmentType<Options>,
    const InitializedType = AttributeField.InitializedType<Options>,
    const PersistedType extends
        | Attribute
        | 'none'
        | 'default'
        | null
        | undefined = AttributeField.InitializedType<Options>,
> extends foundry.data.fields.StringField<
    foundry.data.fields.StringField.Options<
        AttributeField.ValidChoice<Options>
    >,
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
                    label: 'GENERIC.Attribute',
                },
                foundry.utils.mergeObject(options ?? {}, {
                    choices: {
                        ...(options?.includeDefault
                            ? { default: 'GENERIC.Default' }
                            : {}),
                        ...(options?.noneable ? { none: 'GENERIC.None' } : {}),
                        ...Object.entries(CONFIG.COSMERE.attributes).reduce(
                            (acc, [key, config]) => ({
                                ...acc,
                                [key]: config.label,
                            }),
                            {} as Record<Attribute, string>,
                        ),
                    },
                    coerce: (value: unknown) => (value === '' ? null : value),
                }),
            ),
            context,
        );
    }
}

export namespace AttributeField {
    export type Options = foundry.data.fields.StringField.Options<
        Attribute | 'none' | 'default'
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

    export type ValidChoice<Options extends AttributeField.Options> =
        | (Options['noneable'] extends true ? 'none' : never)
        | (Options['includeDefault'] extends true ? 'default' : never)
        | Attribute;

    export type AssignmentType<Options extends AttributeField.Options> =
        foundry.data.fields.DataField.DerivedAssignmentType<
            ValidChoice<Options>,
            Options
        >;

    export type InitializedType<Options extends AttributeField.Options> =
        foundry.data.fields.DataField.DerivedInitializedType<
            ValidChoice<Options>,
            Options
        >;
}
