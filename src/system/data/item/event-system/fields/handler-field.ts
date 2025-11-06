import { IHandler } from '@system/types/item/event-system';
import { constructHandlerClass } from '@system/utils/item/event-system';
import { HandlerBaseSchema } from '../handler';
import { AnyObject, AnyMutableObject } from '@system/types/utils';

// Constants
const NONE_HANDLER_CLASS = constructHandlerClass('none', () => {}, {
    schema: {},
});

type HandlerBaseAssignmentType =
    foundry.data.fields.SchemaField.Internal.AssignmentType<HandlerBaseSchema>;
type HandlerBaseInitializedType = IHandler;
type HandlerBasePersistedType =
    foundry.data.fields.SchemaField.Internal.PersistedType<HandlerBaseSchema>;

export class HandlerField<
    TOptions extends
        foundry.data.fields.DataField.Options<AnyObject> = foundry.data.fields.ObjectField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    TOptions,
    HandlerBaseAssignmentType,
    HandlerBaseInitializedType,
    HandlerBasePersistedType
> {
    /**
     * Get the model for the given handler type
     */
    public static getModelForType(type: string) {
        return type !== 'none'
            ? (CONFIG.COSMERE.items.events.handlers[type]?.documentClass ??
                  null)
            : NONE_HANDLER_CLASS;
    }

    protected override _cleanType(
        value: HandlerBaseInitializedType,
        options?: foundry.data.fields.DataField.CleanOptions,
    ) {
        // Get type
        const type = 'type' in value ? value.type : 'none';

        // Clean value
        return (HandlerField.getModelForType(type)?.cleanData(
            value as unknown as AnyMutableObject,
            options,
        ) ?? value) as unknown as HandlerBaseInitializedType;
    }

    protected override _validateType(
        value: unknown,
        options?: object,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
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
        return (
            typeof value === 'object' ? (value as AnyObject) : {}
        ) as HandlerBaseAssignmentType;
    }

    public _updateDiff<
        TKey extends string,
        TSource extends AnyMutableObject & {
            [key in TKey]: HandlerBaseInitializedType;
        },
        TDifference extends AnyMutableObject & {
            [key in TKey]: HandlerBaseInitializedType;
        },
    >(
        source: TSource,
        key: TKey,
        value: Partial<HandlerBaseInitializedType>,
        difference: TDifference,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ) {
        const fieldSource = source[key];
        const type =
            ('type' in value ? value.type : undefined) ?? fieldSource.type;

        // Standard update diff
        super._updateDiff(source, key, value, difference, options);

        // Ensure type is always included in the diff
        difference[key].type = type;
    }

    public override getInitialValue(data: { type: string }) {
        // Get model
        const cls = HandlerField.getModelForType(data.type);

        // Get initial value
        return cls.schema.getInitialValue(data);
    }

    public override initialize(
        value: HandlerBasePersistedType,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        // Get model
        const cls = HandlerField.getModelForType(value.type);

        // Initialize value
        return (
            cls
                ? value instanceof cls
                    ? value
                    : new cls(foundry.utils.deepClone(value), {
                          parent: model,
                          ...options,
                      })
                : foundry.utils.deepClone(value)
        ) as HandlerBaseInitializedType;
    }
}
