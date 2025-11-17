import { PseudoDocument } from '@system/documents/pseudo/document';

import type { SimpleMerge, AnyObject } from '@system/types/utils';

export class PseudoDocumentField<
    const TDocument extends PseudoDocument.Any,
    const TOptions extends
        PseudoDocumentField.Options<TDocument> = PseudoDocumentField.DefaultOptions,
    const TAssignment = PseudoDocumentField.AssignmentType<TDocument, TOptions>,
    const TInitialized = PseudoDocumentField.InitializedType<
        TDocument,
        TOptions
    >,
    const PersistedType extends
        | AnyObject
        | null
        | undefined = PseudoDocumentField.PersistedType<TDocument, TOptions>,
    const TDocumentClass extends
        PseudoDocumentField.DocumentClass<TDocument> = PseudoDocumentField.DocumentClass<TDocument>,
> extends foundry.data.fields.ObjectField<
    TOptions,
    TAssignment,
    TInitialized,
    PersistedType
> {
    public constructor(
        public readonly document: TDocumentClass,
        options?: TOptions,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(options, context);
    }

    static override recursive = true;

    get documentName() {
        return this.document.documentName;
    }

    public getModelForType;
}

export namespace PseudoDocumentField {
    export type Options<TDocument extends PseudoDocument.Any> =
        foundry.data.fields.DataField.Options<
            TDocument[' __fvtt_types_internal_source_data']
        >;

    export type DefaultOptions = foundry.data.fields.ObjectField.DefaultOptions;

    export namespace Options {
        export type Any = Options<PseudoDocument.Any>;
    }

    export type AssignmentType<
        TDocument extends PseudoDocument.Any,
        TOptions extends PseudoDocumentField.Options<TDocument>,
    > = foundry.data.fields.DataField.DerivedAssignmentType<
        foundry.data.fields.SchemaField.AssignmentData<
            TDocument[' __fvtt_types_internal_schema']
        >,
        TOptions
    >;

    export type InitializedType<
        TDocument extends PseudoDocument.Any,
        TOptions extends PseudoDocumentField.Options<TDocument>,
    > = foundry.data.fields.DataField.DerivedInitializedType<
        TDocument,
        TOptions
    >;

    export type PersistedType<
        TDocument extends PseudoDocument.Any,
        TOptions extends PseudoDocumentField.Options<TDocument>,
    > = foundry.data.fields.DataField.DerivedInitializedType<
        TDocument[' __fvtt_types_internal_source_data'],
        TOptions
    >;

    export type DocumentClass<TDocument extends PseudoDocument.Any> =
        typeof PseudoDocument & { new: (...args: any[]) => TDocument };
}
