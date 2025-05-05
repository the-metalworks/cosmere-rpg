import { constructHandlerClass } from '@system/utils/item/event-system';

// Constants
const NONE_HANDLER_CLASS = constructHandlerClass('none', () => {}, {
    schema: {},
});

export class HandlerField extends foundry.data.fields.ObjectField {
    /**
     * Get the model for the given handler type
     */
    public static getModelForType(type: string) {
        return type !== 'none'
            ? (CONFIG.COSMERE.items.events.handlers[type]?.documentClass ??
                  null)
            : NONE_HANDLER_CLASS;
    }

    protected override _cleanType(value: unknown, options?: object) {
        if (!value || !(typeof value === 'object')) return {};

        // Get type
        const type = 'type' in value ? (value.type as string) : 'none';

        // Clean value
        return (
            HandlerField.getModelForType(type)?.cleanData(value, options) ??
            value
        );
    }

    protected override _validateType(
        value: unknown,
        options?: object,
    ): boolean | foundry.data.fields.DataModelValidationFailure | void {
        if (!value || !(typeof value === 'object'))
            throw new Error('must be a Handler object');

        if (!('type' in value)) throw new Error('must have a type property');
        if (typeof value.type !== 'string')
            throw new Error('field "type" must be a string');

        // Get model
        const cls = HandlerField.getModelForType(value.type);
        if (!cls)
            throw new Error(
                `field "type" must be one of ${Object.keys(CONFIG.COSMERE.items.events.handlers).join(', ')}`,
            );

        // Perform validation
        return cls.schema.validate(value, options);
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' ? value : {};
    }

    public override getInitialValue(data: { type: string }) {
        // Get model
        const cls = HandlerField.getModelForType(data.type);

        // Get initial value
        return cls.schema.getInitialValue(data);
    }

    public override initialize(
        value: { type: string },
        model: object,
        options?: object,
    ) {
        // Get model
        const cls = HandlerField.getModelForType(value.type);

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
