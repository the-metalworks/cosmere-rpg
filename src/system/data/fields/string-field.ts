export interface StringFieldOptions
    extends foundry.data.fields.StringFieldOptions {
    coerce?: (value: unknown) => unknown;
}

export class StringField extends foundry.data.fields.StringField {
    declare options: StringFieldOptions;

    constructor(
        options?: StringFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        super(options, context);
    }

    public override clean(value: unknown, options?: object) {
        if (this.options.coerce) value = this.options.coerce(value);

        return super.clean(value, options);
    }
}
