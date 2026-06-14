import {
    MatchTarget,
    ItemTarget,
    MatchBy,
    MatchMode,
    ItemOnlyTarget,
    SINGLE_MATCH_TARGETS,
} from '@system/utils/match-document';

import type { AnyObject } from '@system/types/utils';

const PREFIXES = ['-=', '=='];
const VALID_DOCUMENT_TYPES = [
    ActiveEffect.documentName,
    Actor.documentName,
    Item.documentName,
];

function defineStepSchema() {
    return {
        target: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            choices: Object.values(MatchTarget).reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: `COSMERE.Utils.MatchDocument.Target.Type.${key}.Label`,
                }),
                {} as Record<ItemTarget, string>,
            ),
            initial: MatchTarget.Self,
            label: `COSMERE.Utils.MatchDocument.Target.Label`,
            hint: `COSMERE.Utils.MatchDocument.Target.Hint`,
        }),
        documentType: new foundry.data.fields.StringField({
            required: true,
            nullable: true,
            initial: null,
            choices: VALID_DOCUMENT_TYPES.reduce(
                (acc, docType) => ({
                    ...acc,
                    [docType]: `DOCUMENT.${docType}`,
                }),
                {} as Record<foundry.abstract.Document.Type, string>,
            ),
            label: `COSMERE.Utils.MatchDocument.DocumentType.Label`,
            hint: `COSMERE.Utils.MatchDocument.DocumentType.Hint`,
        }),
        reference: new foundry.data.fields.DocumentUUIDField({
            nullable: true,
            initial: null,
            label: `COSMERE.Utils.MatchDocument.Reference.Label`,
            hint: `COSMERE.Utils.MatchDocument.Reference.Hint`,
        }),
        matchBy: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            initial: MatchBy.Name,
            choices: Object.values(MatchBy).reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: `COSMERE.Utils.MatchDocument.MatchBy.Type.${key}`,
                }),
                {} as Record<MatchBy, string>,
            ),
            label: `COSMERE.Utils.MatchDocument.MatchBy.Label`,
            hint: `COSMERE.Utils.MatchDocument.MatchBy.Hint`,
        }),
        matchMode: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            initial: MatchMode.First,
            choices: Object.values(MatchMode).reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: `COSMERE.Utils.MatchDocument.MatchMode.Type.${key}`,
                }),
                {} as Record<MatchMode, string>,
            ),
            label: `COSMERE.Utils.MatchDocument.MatchMode.Label`,
            hint: `COSMERE.Utils.MatchDocument.MatchMode.Hint`,
        }),
    };
}

export class MatchDocumentStepDataModel extends foundry.abstract.DataModel<
    MatchDocumentStepDataModel.Schema,
    foundry.abstract.DataModel.Any
> {
    public static override defineSchema() {
        return defineStepSchema();
    }
}

export namespace MatchDocumentStepDataModel {
    export type Schema = ReturnType<typeof defineStepSchema>;
}

export class MatchDocumentStepField<
    const Options extends
        MatchDocumentStepField.Options = MatchDocumentStepField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    Options,
    MatchDocumentStepField.AssignmentType,
    MatchDocumentStepField.InitializedType,
    MatchDocumentStepField.PersistedType
> {
    //@ts-expect-error foundry-vtt-types sets the value to the initialized type, but initialization hasn't happened yet at this point
    protected override _cleanType(
        value: MatchDocumentStepField.AssignmentType,
        options?: foundry.data.fields.DataField.CleanOptions,
    ) {
        // Clear prefixes
        if (value) {
            for (const name of MatchDocumentStepDataModel.schema.keys()) {
                if (foundry.utils.hasProperty(value, name)) continue;

                for (const prefix of PREFIXES) {
                    if (foundry.utils.hasProperty(value, `${prefix}${name}`)) {
                        foundry.utils.deleteProperty(
                            value,
                            `${prefix}${name}` as never,
                        );
                        break;
                    }
                }
            }
        }

        return value;
    }

    protected override _validateType(
        value: MatchDocumentStepField.InitializedType,
        options?: foundry.data.fields.DataField.ValidateOptions<this>,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        const baseResult = MatchDocumentStepDataModel.schema.validate(value, {
            ...options,
            fallback: true,
        } as AnyObject);
        if (baseResult !== undefined) return baseResult;
        if (!value) return;

        const doc = value.reference ? fromUuidSync(value.reference) : null;

        if (value.target === 'self' && value.reference)
            foundry.utils.deleteProperty(value, 'reference');
        if (value.target === 'global' && value.matchBy !== MatchBy.UUID)
            foundry.utils.setProperty(value, 'matchBy', MatchBy.UUID);

        if (doc) {
            if (
                (Object.values(ItemOnlyTarget) as string[]).includes(
                    value.target,
                )
            ) {
                if (doc.documentName !== 'Item')
                    throw new Error(
                        `Target type "${value.target}" can only be used to match Items`,
                    );
            }
        }

        if (
            SINGLE_MATCH_TARGETS.includes(value.target) &&
            value.matchMode === MatchMode.All
        ) {
            value.matchMode = MatchMode.First;
        }
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' && value !== null
            ? (value as AnyObject)
            : ({} as AnyObject);
    }

    public override getInitialValue(data?: unknown) {
        return MatchDocumentStepDataModel.schema.getInitialValue(data);
    }

    public override initialize(
        value: MatchDocumentStepField.PersistedType,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return value instanceof MatchDocumentStepDataModel
            ? value
            : new MatchDocumentStepDataModel(value, {
                  parent: model,
                  ...options,
                  fallback: true,
              });
    }
}

export namespace MatchDocumentStepField {
    export type Options =
        foundry.data.fields.DataField.Options<BaseAssignmentType>;
    export type DefaultOptions = foundry.data.fields.ObjectField.DefaultOptions;

    export type BaseAssignmentType =
        foundry.data.fields.SchemaField.InitializedData<MatchDocumentStepDataModel.Schema>;
    export type AssignmentType =
        foundry.data.fields.SchemaField.Internal.AssignmentType<MatchDocumentStepDataModel.Schema>;
    export type InitializedType = MatchDocumentStepDataModel;
    export type PersistedType =
        foundry.data.fields.SchemaField.Internal.PersistedType<MatchDocumentStepDataModel.Schema>;
}
