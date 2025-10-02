import { ItemRelationship, ItemRelationshipDataSchema } from './data-model';

type PersistedItemRelationship = foundry.data.fields.SchemaField.Internal.PersistedType<ItemRelationshipDataSchema>;

export class ItemRelationshipField extends foundry.data.fields.SchemaField<ItemRelationshipDataSchema> {
    constructor(
        options?: foundry.data.fields.SchemaField.DefaultOptions,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(ItemRelationship.defineSchema(), options, context);
    }

    protected override _cast(value: PersistedItemRelationship) {
        return typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: PersistedItemRelationship,
        model: Item,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return new ItemRelationship(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}
