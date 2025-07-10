import { ItemRelationship } from './data-model';
import { ItemRelationshipType } from './types';

export class ItemRelationshipField extends foundry.data.fields.ObjectField {
    public static getModelForType(type: ItemRelationshipType) {
        switch (type) {
            case ItemRelationshipType.Parent:
                return ItemRelationship;
            case ItemRelationshipType.Child:
                return ItemRelationship;
            default:
                throw new Error(
                    `Unknown item relationship type: ${type as string}`,
                );
        }
    }

    protected override _cleanType(value: unknown, options?: object) {
        if (!value || !(typeof value === 'object')) return {};
        if (!('type' in value)) return {};

        // Get type
        const type = value.type as ItemRelationshipType;

        // Clean value
        return (
            ItemRelationshipField.getModelForType(type).cleanData(
                value,
                options,
            ) ?? value
        );
    }

    protected override _validateType(
        value: unknown,
        options?: object,
    ): boolean | foundry.data.fields.DataModelValidationFailure | void {
        if (!value || !(typeof value === 'object'))
            throw new Error('must be an ItemRelationship object');

        if (!('type' in value)) throw new Error('must have a type property');
        if (typeof value.type !== 'string')
            throw new Error('field "type" must be a string');

        // Get model
        const cls = ItemRelationshipField.getModelForType(
            value.type as ItemRelationshipType,
        );
        if (!cls)
            throw new Error(
                `field "type" must be one of: ${Object.keys(ItemRelationshipType).join(', ')}`,
            );

        // Perform validation
        return cls.schema.validate(value, options);
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' ? value : {};
    }

    public override getInitialValue(data: { type: ItemRelationshipType }) {
        // Get model
        const cls = ItemRelationshipField.getModelForType(data.type);

        // Get initial value
        return cls.schema.getInitialValue(data);
    }

    public override initialize(
        value: { type: ItemRelationshipType },
        model: object,
        options?: object,
    ) {
        // Get model
        const cls = ItemRelationshipField.getModelForType(value.type);

        // Initialize value
        return cls
            ? value instanceof cls
                ? value
                : new cls(foundry.utils.deepClone(value), {
                      parent: model,
                      ...options,
                  })
            : foundry.utils.deepClone(value);
    }
}
