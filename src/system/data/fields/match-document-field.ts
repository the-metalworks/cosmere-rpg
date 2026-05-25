import {
    DocumentTarget,
    ItemTarget,
    MatchBy,
    ItemOnlyTarget,
    SINGLE_MATCH_TARGETS,
} from '@system/utils/match-document';

import type { AnyObject, AnyMutableObject } from '@system/types/utils';

const PREFIXES = ['-=', '=='];

export type MatchDocumentDataModel<
    Options extends
        MatchDocumentDataModel.SchemaDefinitionOptions = MatchDocumentDataModel.SchemaDefinitionOptions,
> = ReturnType<typeof MatchDocumentDataModel.constructForOptions<Options>>;

export namespace MatchDocumentDataModel {
    export interface SchemaDefinitionOptions {
        documentType?: foundry.abstract.Document.Type;
    }

    export type Schema<
        Options extends MatchDocumentDataModel.SchemaDefinitionOptions,
    > = ReturnType<typeof defineSchemaForOptions<Options>>;

    export function constructForOptions<
        const Options extends MatchDocumentDataModel.SchemaDefinitionOptions,
    >(options: Options) {
        return class extends foundry.abstract.DataModel<
            MatchDocumentDataModel.Schema<Options>,
            foundry.abstract.DataModel.Any
        > {
            static override defineSchema() {
                return MatchDocumentDataModel.defineSchemaForOptions(options);
            }
        };
    }

    export function defineSchemaForOptions<
        const Options extends MatchDocumentDataModel.SchemaDefinitionOptions,
    >(options: Options) {
        const requiresNonItemDocument =
            options.documentType && options.documentType !== 'Item';

        return {
            target: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                choices: Object.values(
                    requiresNonItemDocument ? DocumentTarget : ItemTarget,
                ) // Use more limited `DocumentTarget` if we know for certain we're matching a non-Item document
                    .reduce(
                        (acc, key) => ({
                            ...acc,
                            [key]: `COSMERE.Utils.MatchDocument.Target.Type.${key}`,
                        }),
                        {} as Record<ItemTarget, string>,
                    ),
                initial: DocumentTarget.Self as ItemTarget,
                label: `COSMERE.Utils.MatchDocument.Target.Label`,
                hint: `COSMERE.Utils.MatchDocument.Target.Hint`,
            }),
            documentType: new foundry.data.fields.StringField({
                required: !!options.documentType,
                nullable: !options.documentType,
                initial: options.documentType ?? null,
                choices: options.documentType
                    ? {
                          [options.documentType]: `DOCUMENT.${options.documentType}`,
                      }
                    : Object.keys(game.documentTypes).reduce(
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
                type: options.documentType,
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
            matchAll: new foundry.data.fields.BooleanField({
                required: true,
                nullable: false,
                initial: false,
                label: `COSMERE.Utils.MatchDocument.MatchAll.Label`,
                hint: `COSMERE.Utils.MatchDocument.MatchAll.Hint`,
            }),
        };
    }
}

export class MatchDocumentField<
    const Options extends
        MatchDocumentField.Options = MatchDocumentField.DefaultOptions,
> extends foundry.data.fields.ObjectField<
    Options,
    MatchDocumentField.AssignmentType<Options>,
    MatchDocumentField.InitializedType<Options>,
    MatchDocumentField.PersistedType<Options>
> {
    protected dataModel: MatchDocumentDataModel<Options>;

    constructor(
        options?: Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(options, context);

        this.dataModel = MatchDocumentDataModel.constructForOptions(
            options ?? {},
        );
    }

    //@ts-expect-error foundry-vtt-types sets the value to the initialized type, but initialization hasn't happened yet at this point
    protected override _cleanType(
        value: MatchDocumentField.AssignmentType<Options>,
        options: foundry.data.fields.DataField.CleanOptions = {},
    ) {
        // Clear prefixes
        if (value) {
            for (const name of this.dataModel.schema.keys()) {
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
        value: MatchDocumentField.InitializedType<Options>,
        options?: foundry.data.fields.DataField.ValidateOptions<this>,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        const baseResult = this.dataModel.schema.validate(value, {
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

        if (SINGLE_MATCH_TARGETS.includes(value.target)) {
            value.matchAll = false;
        }
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' && value !== null
            ? (value as AnyObject)
            : ({} as AnyObject);
    }

    public override getInitialValue(data?: unknown) {
        return this.dataModel.schema.getInitialValue(data);
    }

    public override initialize(
        value: MatchDocumentField.PersistedType<Options>,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return (
            value instanceof this.dataModel
                ? value
                : new this.dataModel(value, {
                      parent: model,
                      ...options,
                      fallback: true,
                  })
        ) as MatchDocumentField.InitializedType<Options>;
    }
}

export namespace MatchDocumentField {
    export type Schema<
        Options extends
            MatchDocumentDataModel.SchemaDefinitionOptions = MatchDocumentDataModel.SchemaDefinitionOptions,
    > = MatchDocumentDataModel.Schema<Options>;

    export type Options =
        foundry.data.fields.DataField.Options<BaseAssignmentType> &
            MatchDocumentDataModel.SchemaDefinitionOptions;

    export type DefaultOptions = foundry.data.fields.DataField.DefaultOptions;

    export type BaseAssignmentType =
        foundry.data.fields.SchemaField.Internal.AssignmentType<
            Schema,
            DefaultOptions
        >;

    export type AssignmentType<Options extends MatchDocumentField.Options> =
        foundry.data.fields.SchemaField.Internal.AssignmentType<
            Schema<Options>,
            Options
        >;
    export type InitializedType<
        Options extends MatchDocumentField.Options = MatchDocumentField.Options,
    > = InstanceType<MatchDocumentDataModel<Options>> & {
        documentType: Options['documentType'];
    };
    export type PersistedType<Options extends MatchDocumentField.Options> =
        foundry.data.fields.SchemaField.Internal.PersistedType<Schema<Options>>;
}
