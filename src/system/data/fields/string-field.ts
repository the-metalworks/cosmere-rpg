export class StringField<
    const Options extends StringField.Options<unknown> = StringField.Options,
> extends foundry.data.fields.StringField<Options> {
    protected override _cleanType(
        value: foundry.data.fields.StringField.InitializedType<Options>,
        options?: foundry.data.fields.DataField.CleanOptions,
    ): foundry.data.fields.StringField.InitializedType<Options> {
        value = super._cleanType(value, options);

        try {
            const validationResult = this._validateType(value, options);
            if (
                validationResult === false ||
                typeof validationResult === 'object'
            )
                throw new Error();
        } catch {
            if (this.options.allowFallback) {
                value =
                    this.getInitialValue() ??
                    ('' as foundry.data.fields.StringField.InitializedType<Options>);
            }
        }

        return value;
    }
}

export namespace StringField {
    export interface Options<Type = string>
        extends foundry.data.fields.StringField.Options<Type> {
        /**
         * Whether to allow the field to fallback to its initial value (or blank if no initial value is defined) when it fails validation.
         */
        allowFallback?: boolean;
    }

    export type DefaultOptions = foundry.data.fields.StringField.DefaultOptions;

    export type InitializedType<Options extends StringField.Options<unknown>> =
        foundry.data.fields.StringField.InitializedType<Options>;
}
