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

    export function getValue<T extends number | string | boolean>(
        derived: Derived<T>,
        includeBonus = true,
    ) {
        const value = derived.useOverride ? derived.override : derived.value;

        return includeBonus && 'bonus' in derived
            ? (value as number) + derived.bonus!
            : value;
    }

    export function getMode<T extends number | string | boolean>(
        derived: Derived<T>,
    ) {
        return derived.useOverride ? Mode.Override : Mode.Derived;
    }

    export function setMode<T extends number | string | boolean>(
        derived: Derived<T>,
        mode: Mode,
    ) {
        derived.useOverride = mode === Mode.Override;
    }
}

export interface DerivedValueFieldOptions
    extends foundry.data.fields.DataFieldOptions {
    additionalFields?: foundry.data.fields.DataSchema;
}

/**
 * Type for dealing with derived values.
 * Provides standard functionality for manual overrides
 */
export type Derived<T extends number | string | boolean> = {
    /**
     * The derived value
     */
    value?: T;

    /**
     * The override value to use if `useOverride` is set to true
     */
    override?: T;

    /**
     * Whether or not the override value should be used (rather than the derived)
     */
    useOverride?: boolean;
} & (T extends number ? { bonus?: number } : EmptyObject);

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

                value: element,
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
}
