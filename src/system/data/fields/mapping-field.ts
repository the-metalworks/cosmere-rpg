export type MappingFieldOptions = foundry.data.fields.DataFieldOptions;

export class MappingField<
    ElementField extends foundry.data.fields.DataField,
> extends foundry.data.fields.ObjectField {
    constructor(
        public readonly model: ElementField,
        options: MappingFieldOptions = {},
    ) {
        super(options);
    }

    protected _cleanType(value: Record<string, unknown>, options?: object) {
        Object.entries(value).forEach(([key, v]) => {
            value[key] = this.model.clean(v, options);
        });

        return value;
    }

    protected _validateType(
        value: Record<string, unknown>,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ): boolean | foundry.data.fields.DataModelValidationFailure | void {
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
        value: Record<string, unknown>,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ) {
        const errors: Record<
            string,
            foundry.data.validation.DataModelValidationFailure
        > = {};
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

    public initialize(value: Record<string, unknown>) {
        if (!value) return value;
        return value;
    }

    _getField(path: string[]): foundry.data.fields.DataField {
        if (path.length === 0) return this;
        else if (path.length === 1) return this.model;

        path.shift();
        return this.model._getField(path);
    }
}
