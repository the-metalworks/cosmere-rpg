import { AnyObject } from '@system/types/utils';
import { InferAssignmentType, InferInitializedType } from '../types';

export class MappingField<
    const ElementField extends foundry.data.fields.DataField.Any,
    const TOptions extends
        MappingField.Options<AnyObject> = MappingField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    TOptions,
    MappingField.AssignmentType<ElementField, TOptions> | null | undefined,
    MappingField.InitializedType<ElementField, TOptions>
> {
    constructor(
        public readonly model: ElementField,
        options = {} as TOptions,
    ) {
        super(options);
    }

    protected _cleanType(
        value: MappingField.InitializedType<ElementField, TOptions>,
        options?: object,
    ) {
        if (!value) return value;

        Object.entries(value).forEach(([key, v]) => {
            value[key] = this.model.clean(
                v,
                options,
            ) as InferInitializedType<ElementField>;
        });

        return value;
    }

    protected _validateType(
        value: MappingField.InitializedType<ElementField, TOptions>,
        options?: foundry.data.fields.DataField.ValidateOptions<foundry.data.fields.DataField.Any>,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        if (foundry.utils.getType(value) !== 'Object')
            throw new Error('must be an Object');

        const errors = this._validateValues(value, options);

        if (!foundry.utils.isEmpty(errors)) {
            // Create validatior failure
            const failure =
                new foundry.data.validation.DataModelValidationFailure();

            // Set fields
            failure.fields = errors;

            // Throw error
            throw new foundry.data.validation.DataModelValidationError(failure);
        }
    }

    protected _validateValues(
        value: MappingField.InitializedType<ElementField, TOptions>,
        options?: foundry.data.fields.DataField.ValidateOptions<ElementField>,
    ) {
        const errors: Record<
            string,
            foundry.data.validation.DataModelValidationFailure
        > = {};

        if (!value) return errors;

        Object.entries(value).forEach(([key, v]) => {
            const error = this.model.validate(
                v,
                options,
            ) as foundry.data.validation.DataModelValidationFailure | null;
            if (error) errors[key] = error;
        });
        return errors;
    }

    getInitialValue() {
        return {};
    }

    // TODO: Resolve typing issues
    // NOTE: Use any as workaround for foundry-vtt-types issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public initialize(value: any) {
        // TEMP: Workaround
        if (!value) return value;
        return value;
    }
    // public initialize(value: MappingField.InitializedType<ElementField, TOptions>) {

    _getField(path: string[]): foundry.data.fields.DataField.Any | undefined {
        if (path.length === 0) return this;
        else if (path.length === 1) return this.model;

        path.shift();
        return (
            this.model as unknown as {
                _getField: (
                    path: string[],
                ) => foundry.data.fields.DataField.Any | undefined;
            }
        )._getField(path);
    }
}

export namespace MappingField {
    export type Options<AssignmentType> =
        foundry.data.fields.DataField.Options<AssignmentType>;
    export type DefaultOptions = foundry.data.fields.DataField.DefaultOptions;

    export type AssignmentType<
        ElementField extends
            foundry.data.fields.DataField<foundry.data.fields.DataField.Any>,
        TOptions extends MappingField.Options<AnyObject>,
    > = foundry.data.fields.DataField.DerivedAssignmentType<
        Record<string, InferAssignmentType<ElementField>>,
        TOptions
    >;

    export type InitializedType<
        ElementField extends
            foundry.data.fields.DataField<foundry.data.fields.DataField.Any>,
        TOptions extends MappingField.Options<AnyObject>,
    > = foundry.data.fields.DataField.DerivedInitializedType<
        Record<string, InferInitializedType<ElementField>>,
        TOptions
    >;
}
