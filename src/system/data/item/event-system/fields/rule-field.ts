import { Rule } from '../index';

export class RuleField extends foundry.data.fields.SchemaField {
    constructor(
        options?: foundry.data.fields.DataFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        super(Rule.defineSchema(), options, context);
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: unknown,
        model: object,
        options?: object,
    ) {
        return new Rule(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}
