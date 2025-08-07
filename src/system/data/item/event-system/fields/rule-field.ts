import { Rule, RuleDataSchema } from '../index';

type PersistedRule = foundry.data.fields.SchemaField.Internal.PersistedType<RuleDataSchema>;

export class RuleField extends foundry.data.fields.SchemaField<RuleDataSchema> {
    constructor(
        options?: foundry.data.fields.SchemaField.DefaultOptions,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(Rule.defineSchema(), options, context);
    }

    protected override _cast(value: PersistedRule) {
        return typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: PersistedRule,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return new Rule(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}
