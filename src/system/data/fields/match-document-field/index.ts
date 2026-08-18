import { MatchDocumentStepField } from './step';
import type { AnyObject } from '@system/types/utils';

function defineModelSchema() {
    return {
        steps: new foundry.data.fields.ArrayField(
            new MatchDocumentStepField({ required: true, nullable: false }),
            {
                required: true,
                nullable: false,
                min: 1,
                initial: [{}],
            },
        ),
    };
}

export class MatchDocumentDataModel extends foundry.abstract.DataModel<
    MatchDocumentDataModel.Schema,
    foundry.abstract.DataModel.Any
> {
    public static override defineSchema() {
        return defineModelSchema();
    }
}

export namespace MatchDocumentDataModel {
    export type Schema = ReturnType<typeof defineModelSchema>;
}

export class MatchDocumentField<
    const Options extends
        MatchDocumentField.Options = MatchDocumentField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    Options,
    MatchDocumentField.AssignmentType,
    MatchDocumentField.InitializedType,
    MatchDocumentField.PersistedType
> {
    //@ts-expect-error foundry-vtt-types sets the value to the initialized type, but initialization hasn't happened yet at this point
    protected override _cleanType(
        value: MatchDocumentField.AssignmentType,
        options?: foundry.data.fields.DataField.CleanOptions,
    ): MatchDocumentField.AssignmentType {
        return MatchDocumentDataModel.schema.clean(
            value,
            options,
        ) as MatchDocumentField.AssignmentType;
    }

    protected override _validateType(
        value: MatchDocumentField.InitializedType,
        options?: foundry.data.fields.DataField.ValidateOptions<this>,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        return MatchDocumentDataModel.schema.validate(
            value,
            options as AnyObject,
        );
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' && value !== null
            ? (value as AnyObject)
            : ({} as AnyObject);
    }

    public override getInitialValue(data?: unknown) {
        return MatchDocumentDataModel.schema.getInitialValue(data);
    }

    public override initialize(
        value: MatchDocumentField.PersistedType,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return value instanceof MatchDocumentDataModel
            ? value
            : new MatchDocumentDataModel(value, {
                  parent: model,
                  ...options,
              });
    }
}

export namespace MatchDocumentField {
    export type Options =
        foundry.data.fields.DataField.Options<BaseAssignmentType>;
    export type DefaultOptions = foundry.data.fields.ObjectField.DefaultOptions;

    export type BaseAssignmentType =
        foundry.data.fields.SchemaField.InitializedData<MatchDocumentDataModel.Schema>;
    export type AssignmentType =
        foundry.data.fields.SchemaField.Internal.AssignmentType<MatchDocumentDataModel.Schema>;
    export type InitializedType = MatchDocumentDataModel;
    export type PersistedType =
        foundry.data.fields.SchemaField.Internal.PersistedType<MatchDocumentDataModel.Schema>;

    export namespace Step {
        export type InitializedType = MatchDocumentStepField.InitializedType;
    }
}
