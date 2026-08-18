import { ItemConsumeType } from '@system/types/cosmere';
import {
    type AnyObject,
    type AnyMutableObject,
    NONE,
    type Noneable,
    type DeepPartial,
} from '@system/types/utils';

// Schema
import {
    type ActivationConsumptionSchema,
    type ActivationConsumptionDataModel,
    getDataModelForConsumeType,
    NoneConsumptionDataModel,
} from './schema';

export class ActivationConsumptionField<
    Options extends
        ActivationConsumptionField.Options = ActivationConsumptionField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    Options,
    ActivationConsumptionField.AssignmentType,
    ActivationConsumptionField.InitializedType,
    ActivationConsumptionField.PersistedType
> {
    public readonly baseModel = NoneConsumptionDataModel;

    public get baseFields() {
        return this.baseModel.schema.fields;
    }

    public static getModelForType<const T extends Noneable<ItemConsumeType>>(
        type: T,
    ) {
        return getDataModelForConsumeType(type);
    }

    //@ts-expect-error foundry-vtt-types sets the value to the initialized type, but initialization hasn't happened yet at this point
    protected override _cleanType(
        value: Exclude<
            ActivationConsumptionField.AssignmentType,
            null | undefined
        >,
        options?: foundry.data.fields.DataField.CleanOptions,
    ) {
        const type: Noneable<ItemConsumeType> = value.type ?? NONE;
        const Model = ActivationConsumptionField.getModelForType(type);

        const cleaned = Model.cleanData(
            value as AnyMutableObject,
            options,
        ) as Exclude<
            ActivationConsumptionField.AssignmentType,
            null | undefined
        >;

        return cleaned;
    }

    protected override _validateType(
        value: unknown,
        options?: object,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        if (!value || typeof value !== 'object')
            throw new Error('must be an object');

        if (!('type' in value)) throw new Error('must have a type property');
        if (typeof value.type !== 'string')
            throw new Error('field "type" must be a string');

        const Model = ActivationConsumptionField.getModelForType(
            value.type as Noneable<ItemConsumeType>,
        );
        return Model.schema.validate(value, options);
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' && value !== null
            ? (value as AnyObject)
            : ({} as AnyObject);
    }

    protected override _addTypes(
        source?: AnyMutableObject & ActivationConsumptionField.InitializedType,
        changes?: AnyMutableObject &
            DeepPartial<ActivationConsumptionField.InitializedType>,
    ) {
        if (!source || !changes) return super._addTypes(source, changes);

        changes.type ??= source.type;
    }

    public _updateDiff<
        TKey extends string,
        TSource extends AnyMutableObject & {
            [key in TKey]: ActivationConsumptionField.InitializedType;
        },
        TDifference extends AnyMutableObject & {
            [key in TKey]: ActivationConsumptionField.InitializedType;
        },
    >(
        source: TSource,
        key: TKey,
        value: Partial<ActivationConsumptionField.InitializedType>,
        difference: TDifference,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ) {
        const fieldSource = source[key];
        const type =
            ('type' in value ? value.type : undefined) ?? fieldSource.type;

        const Model = ActivationConsumptionField.getModelForType(type);
        const schema = Model.schema;

        schema._updateDiff(source, key, value, difference, options);

        difference[key] ??= {} as (typeof difference)[TKey];
        difference[key].type = type;
    }

    public override getInitialValue(data?: unknown) {
        const type =
            (foundry.utils.getProperty(this._cast(data), 'type') as
                | ItemConsumeType
                | undefined) ?? NONE;
        const Model = ActivationConsumptionField.getModelForType(type);
        return Model.schema.getInitialValue(data);
    }

    public override initialize(
        value: ActivationConsumptionField.PersistedType,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        const Model = ActivationConsumptionField.getModelForType(value.type);
        return (
            value instanceof Model
                ? value
                : new Model(foundry.utils.deepClone(value), {
                      parent: model,
                      ...options,
                  })
        ) as ActivationConsumptionField.InitializedType;
    }
}

export namespace ActivationConsumptionField {
    export type Options = foundry.data.fields.DataField.Options<AnyObject>;
    export type DefaultOptions = foundry.data.fields.DataField.DefaultOptions;

    export type Schema = ActivationConsumptionSchema;

    export type AssignmentType =
        foundry.data.fields.SchemaField.Internal.AssignmentType<Schema>;
    export type InitializedType = ActivationConsumptionDataModel;
    export type PersistedType =
        foundry.data.fields.SchemaField.Internal.PersistedType<Schema>;
}
