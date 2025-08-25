import { ConstructorOf, EmptyObject, AnyObject, Merge } from '@system/types/utils';

import {
    InferOptions,
    InferInitializedType,
    DataSchemaInitializedType
} from '../types';

// NOTE: Specifically use a namespace here to merge with interface declaration
export namespace Derived {
    export enum Mode {
        Derived = 'derived',
        Override = 'override',
    }

    export const Modes = {
        [Mode.Derived]: 'GENERIC.DerivedValue.Mode.Derived',
        [Mode.Override]: 'GENERIC.DerivedValue.Mode.Override',
    };
}

/**
 * Type for dealing with derived values.
 * Provides standard functionality for manual overrides
 */
export type Derived<
    T extends number | string | boolean = number | string | boolean,
    TAdditionalFields extends AnyObject = {},
> = {
    /**
     * The final value.
     * This is either the derived value or the override value, depending on the `useOverride` flag.
     * Additionally if the value is a number, the bonus is added to the final value.
     */
    readonly value: T;

    /**
     * The derived value
     */
    derived: T;

    /**
     * The override value to use if `useOverride` is set to true
     */
    override?: T;

    /**
     * Whether or not the override value should be used (rather than the derived)
     */
    useOverride: boolean;

    /**
     * The mode of the derived value (derived or override).
     * This serves as a getter/setter for the `useOverride` flag
     */
    mode: Derived.Mode;
} & (T extends number
    ? {
        /**
         * The final value before the bonus is added.
         * This is either the derived value or the override value, depending on the `useOverride` flag.
         */
        readonly base: number;

        /**
         * Additional bonus to add to the value
         */
        bonus: number;
    }
    : EmptyObject) & TAdditionalFields;

type NullableElementField<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>
> = ElementFieldAssignOptions<ElementField, { nullable: true, required: true, initial: null }>;

type NonNullableElementField<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>
> = ElementFieldAssignOptions<ElementField, { nullable: false, required: true }>;

type ElementFieldAssignOptions<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
    TOptions extends foundry.data.fields.DataField.Options.Any,
> = ElementField extends foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    ? foundry.data.fields.NumberField<TOptions>
    : foundry.data.fields.StringField<TOptions>;

function SCHEMA<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
    TOptions extends DerivedValueField.Options<ElementField, foundry.data.fields.DataSchema>
>(element: ElementField, options: TOptions) {
    return {
        ...options.additionalFields,

        derived: element,
        override: new (Object.getPrototypeOf(element) as { constructor: ConstructorOf<NullableElementField<ElementField>> })
            .constructor({
                ...element.options,
                initial: null,
                required: false,
                nullable: true,
            }),
        useOverride: new foundry.data.fields.BooleanField({
            required: true,
            nullable: false,
            initial: false,
        }),

        ...(element instanceof foundry.data.fields.NumberField
            ? {
                bonus: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 0,
                }),
            }
            : {}),
    }
}

export type DerivedValueFieldSchema<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
    TOptions extends DerivedValueField.Options<ElementField, foundry.data.fields.DataSchema>
> = ReturnType<typeof SCHEMA<ElementField, TOptions>>;

export class DerivedValueField<
    ElementField extends
    | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
    | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
    TOptions extends DerivedValueField.Options<ElementField, foundry.data.fields.DataSchema>,
    TAdditionalFieldsSchema extends foundry.data.fields.DataSchema = TOptions extends DerivedValueField.Options<ElementField, infer U> ? U : never
> extends foundry.data.fields.SchemaField<
    DerivedValueFieldSchema<ElementField, TOptions>,
    TOptions,
    DerivedValueField.AssignmentType<ElementField, TAdditionalFieldsSchema>,
    DerivedValueField.InitializedType<ElementField, TAdditionalFieldsSchema>,
    DerivedValueField.PersistedType<ElementField, TAdditionalFieldsSchema>
> {
    constructor(
        element: ElementField,
        options?: TOptions,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        // Update element options
        element.options.required = true;

        super(
            SCHEMA(element, options ?? {}),
            options,
            context,
        );
    }

    public override initialize(
        value: DerivedValueField.PersistedType<ElementField, TAdditionalFieldsSchema>,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        const superInitialized = super.initialize(value, model, options);
        value = typeof superInitialized === 'function' ?
            superInitialized() ?? value : superInitialized;

        if (!Object.hasOwn(value, 'value')) {
            Object.defineProperties(value, {
                value: {
                    get: function (this: Derived) {
                        if ('bonus' in this) {
                            return this.base + this.bonus;
                        } else {
                            return this.useOverride
                                ? this.override
                                : this.derived;
                        }
                    },
                },
                base: {
                    get: function (this: Derived) {
                        return this.useOverride ? this.override : this.derived;
                    },
                },
                mode: {
                    get: function (this: Derived) {
                        return this.useOverride
                            ? Derived.Mode.Override
                            : Derived.Mode.Derived;
                    },
                    set: function (this: Derived, mode: Derived.Mode) {
                        this.useOverride = mode === Derived.Mode.Override;
                    },
                },
            });
        }

        return value as DerivedValueField.InitializedType<ElementField, TAdditionalFieldsSchema>;
    }
}

export namespace DerivedValueField {
    export type AssignmentType<
        ElementField extends
        | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
        | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
        TAdditionalFieldsSchema extends foundry.data.fields.DataSchema,
    > = Derived<InferInitializedType<NonNullableElementField<ElementField>>, foundry.data.fields.SchemaField.InitializedData<TAdditionalFieldsSchema>> | null | undefined;

    export type InitializedType<
        ElementField extends
        | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
        | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
        TAdditionalFieldsSchema extends foundry.data.fields.DataSchema,
    > = Derived<InferInitializedType<NonNullableElementField<ElementField>>, foundry.data.fields.SchemaField.InitializedData<TAdditionalFieldsSchema>>;

    export type PersistedType<
        ElementField extends
        | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
        | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
        TAdditionalFieldsSchema extends foundry.data.fields.DataSchema,
    > = Omit<Derived<InferInitializedType<NonNullableElementField<ElementField>>, foundry.data.fields.SchemaField.InitializedData<TAdditionalFieldsSchema>>, 'value' | 'base'>;

    export interface Options<
        ElementField extends
        | foundry.data.fields.NumberField<foundry.data.fields.NumberField.Options>
        | foundry.data.fields.StringField<foundry.data.fields.StringField.Options>,
        TAdditionalFieldsSchema extends foundry.data.fields.DataSchema
    > extends foundry.data.fields.DataField.Options<InitializedType<ElementField, TAdditionalFieldsSchema>> {
        additionalFields?: TAdditionalFieldsSchema;
    }
}