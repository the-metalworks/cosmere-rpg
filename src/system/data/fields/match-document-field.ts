import {
    DocumentTarget,
    ItemTarget,
    MatchBy,
    ItemOnlyTarget,
} from '@system/utils/match-document';

import type { AnyObject } from '@system/types/utils';

const PREFIXES = ['-=', '=='];

export class MatchDocumentField<
    const Options extends
        MatchDocumentField.Options = MatchDocumentField.DefaultOptions,
> extends foundry.data.fields.SchemaField<
    MatchDocumentField.Schema<Options>,
    Options,
    MatchDocumentField.AssignmentType<Options>,
    MatchDocumentField.InitializedType<Options>,
    MatchDocumentField.InitializedType<Options>
> {
    constructor(
        options?: Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(MatchDocumentField.defineSchema(options ?? {}), options, context);
    }

    public static defineSchema<
        const Options extends
            MatchDocumentField.Internal.SchemaDefinitionOptions,
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
                            [key]: `COSMERE.Utils.MatchDocument.Target.${key}`,
                        }),
                        {} as Record<ItemTarget, string>,
                    ),
                initial: DocumentTarget.Self,
                label: `COSMERE.Utils.MatchDocument.Target.Label`,
                hint: `COSMERE.Utils.MatchDocument.Target.Hint`,
            }),
            reference: new foundry.data.fields.DocumentUUIDField({
                nullable: true,
                initial: null,
                label: `COSMERE.Utils.MatchDocument.Document.Label`,
                hint: `COSMERE.Utils.MatchDocument.Document.Hint`,
                type: options.documentType,
            }),
            matchBy: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                initial: MatchBy.Name,
                choices: Object.values(MatchBy).reduce(
                    (acc, key) => ({
                        ...acc,
                        [key]: `COSMERE.Utils.MatchDocument.MatchBy.${key}`,
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

    protected override _cleanType(
        value: MatchDocumentField.InitializedType<Options>,
        options: foundry.data.fields.DataField.CleanOptions = {},
    ): MatchDocumentField.InitializedType<Options> {
        options.source ??= value ?? {};

        // Clear prefixes
        if (value) {
            for (const name of this.keys()) {
                if (foundry.utils.hasProperty(value, name)) continue;

                for (const prefix of PREFIXES) {
                    if (foundry.utils.hasProperty(value, `${prefix}${name}`)) {
                        // foundry.utils.setProperty(value, name, foundry.utils.getProperty(value, `${prefix}${name}`));
                        foundry.utils.deleteProperty(
                            value,
                            `${prefix}${name}` as never,
                        );
                        break;
                    }
                }
            }
        }

        // Inject source values for missing keys to ensure validation has access to all relevant data
        value = foundry.utils.mergeObject(
            options.source,
            super._cleanType(value, options)!,
            {
                inplace: false,
            },
        ) as MatchDocumentField.InitializedType<Options>;

        // if (value) {
        //     const doc = value.reference ? fromUuidSync(value.reference) : null;

        //     if (doc) {

        //     }
        // }

        return value;
    }

    protected override _validateType(
        value: MatchDocumentField.InitializedType<Options>,
        options?: foundry.data.fields.DataField.ValidateOptions<this>,
    ): boolean | foundry.data.validation.DataModelValidationFailure | void {
        const superResult = super._validateType(value, options);
        if (superResult !== true && superResult !== undefined)
            return superResult;
        if (!value) return;

        const doc = value.reference ? fromUuidSync(value.reference) : null;

        if (value.target === 'self' && value.reference)
            throw new Error('Target type "self" cannot be used with a UUID');
        if (value.target === 'global' && value.matchBy !== MatchBy.UUID)
            throw new Error(
                'Target type "global" only supports matching by UUID',
            );

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
    }
}

export namespace MatchDocumentField {
    export namespace Internal {
        export interface SchemaDefinitionOptions {
            documentType?: foundry.abstract.Document.Type;
        }
    }

    export type Schema<
        Options extends
            Internal.SchemaDefinitionOptions = Internal.SchemaDefinitionOptions,
    > = ReturnType<typeof MatchDocumentField.defineSchema<Options>>;

    export type Options =
        foundry.data.fields.DataField.Options<BaseAssignmentType> &
            Internal.SchemaDefinitionOptions;

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

    export type InitializedType<Options extends MatchDocumentField.Options> =
        foundry.data.fields.SchemaField.Internal.InitializedType<
            Schema,
            Options
        >;
}
