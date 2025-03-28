import { ConstructorOf, EmptyObject } from '@system/types/utils';

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

export interface DerivedValueFieldOptions
    extends foundry.data.fields.DataFieldOptions {
    additionalFields?: foundry.data.fields.DataSchema;
}

/**
 * Type for dealing with derived values.
 * Provides standard functionality for manual overrides
 */
export type Derived<
    T extends number | string | boolean = number | string | boolean,
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
    : EmptyObject);

export class DerivedValueField<
    ElementField extends
        | foundry.data.fields.NumberField
        | foundry.data.fields.StringField,
> extends foundry.data.fields.SchemaField {
    constructor(
        element: ElementField,
        options?: DerivedValueFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        // Update element options
        element.options.required = true;

        super(
            {
                ...options?.additionalFields,

                derived: element,
                override: new ((Object.getPrototypeOf(element) as object)
                    .constructor as ConstructorOf<ElementField>)({
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
            },
            options,
            context,
        );
    }

    public override initialize(
        value: Omit<Derived, 'value' | 'base'>,
        model: object,
        options?: object,
    ) {
        value = super.initialize(value, model, options) as Omit<
            Derived,
            'value' | 'base'
        >;

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

        return value;
    }
}
