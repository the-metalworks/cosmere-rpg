import type {
    PseudoDocument,
    PseudoDocumentClass,
} from '@system/documents/pseudo/document';
import type {
    SimpleMerge,
    AnyObject,
    AnyMutableObject,
} from '@system/types/utils';

export class PseudoDocumentField<
    const TDocument extends PseudoDocument.Any,
    const TOptions extends
        PseudoDocumentField.Options<TDocument> = PseudoDocumentField.DefaultOptions,
    const TAssignment = PseudoDocumentField.AssignmentType<TDocument, TOptions>,
    const TInitialized = PseudoDocumentField.InitializedType<
        TDocument,
        TOptions
    >,
    const TPersisted extends
        | AnyObject
        | null
        | undefined = PseudoDocumentField.PersistedType<TDocument, TOptions>,
    const TConcreteDocumentType extends
        PseudoDocument.ConcreteDocumentType = TDocument extends PseudoDocument<
        infer U
    >
        ? U
        : PseudoDocument.ConcreteDocumentType,
    const TDocumentClass extends
        PseudoDocumentClass<TConcreteDocumentType> = PseudoDocumentClass<TConcreteDocumentType>,
> extends foundry.data.fields.ObjectField<
    TOptions,
    TAssignment,
    TInitialized,
    TPersisted
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

    public getModelForType<
        T extends foundry.abstract.Document.SubTypesOf<TConcreteDocumentType>,
    >(type: T): foundry.abstract.DataModel.ConcreteConstructor;
    public getModelForType<
        T extends foundry.abstract.Document.SubTypesOf<TConcreteDocumentType>,
    >(
        type: T | string | undefined,
    ): foundry.abstract.DataModel.ConcreteConstructor | null;
    public getModelForType<
        T extends foundry.abstract.Document.SubTypesOf<TConcreteDocumentType>,
    >(type: T | string | undefined) {
        return this.document.getModelForType(type);
    }

    public override getInitialValue(data?: unknown): TInitialized {
        const initial = super.getInitialValue(data); // ObjectField could return this.initial, undefined, null, or {}
        if (foundry.utils.getType(initial) === 'Object')
            return this._cleanType(initial, {
                partial: false,
                source: data as AnyObject,
            });

        return initial as TInitialized;
    }

    protected override _cleanType(
        value: TInitialized,
        options?: foundry.data.fields.DataField.CleanOptions,
    ): TInitialized {
        if (foundry.utils.getType(value) !== 'Object')
            value = {} as TInitialized;

        const type = options?.source?.type as
            | foundry.abstract.Document.SubTypesOf<TConcreteDocumentType>
            | undefined;
        const cls = type ? this.getModelForType(type) : null;
        if (cls)
            return cls.cleanData(value as AnyObject, {
                ...options,
                source: value as AnyObject,
            }) as TInitialized;

        return value;
    }

    public override initialize(
        value: TPersisted,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ): TInitialized {
        const source = model._source as AnyObject;
        const type = source.type as
            | foundry.abstract.Document.SubTypesOf<TConcreteDocumentType>
            | undefined;
        const cls = type ? this.getModelForType(type) : null;

        if (cls) {
            const instance = new cls(value ?? {}, {
                parent: model,
                ...options,
            });
        }

        return foundry.utils.deepClone(value) as unknown as TInitialized;
    }

    public override _updateDiff(
        source: AnyMutableObject,
        key: string,
        value: unknown,
        difference: AnyObject,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ): void {
        const cls = this.getModelForType(source.type as string);
        if (cls)
            cls.schema._updateDiff(source, key, value, difference, options);
        else super._updateDiff(source, key, value, difference, options);
    }

    public override _updateCommit(
        source: AnyMutableObject,
        key: string,
        value: unknown,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ): void {
        const cls = this.getModelForType(source.type as string);
        if (cls) cls.schema._updateCommit(source, key, value, options);
        else super._updateCommit(source, key, value, options);
    }

    public override _addTypes(
        source?: AnyObject,
        changes?: AnyObject,
        options?: foundry.data.fields.DataField.AddTypesOptions,
    ) {
        const cls = this.getModelForType(source?.type as string);
        // @ts-expect-error _addTypes is declared as protected in foundry-vtt-types, but used publicly by Foundry in practice
        cls?.schema._addTypes(source, changes, options);
    }

    public override _validateType(
        value: TInitialized,
        options?: foundry.data.fields.DataField.ValidateOptions<foundry.data.fields.DataField.Any>,
    ) {
        const result = super._validateType(value, options);
        if (result !== undefined) return result;

        const cls = this.getModelForType(options?.source?.type as string);
        return cls?.schema.validate(value as AnyObject, {
            ...options,
            source: value as AnyObject,
        });
    }

    public override _validateModel(
        changes: AnyObject,
        options?: foundry.data.fields.DataField.ValidateModelOptions,
    ) {
        const cls = this.getModelForType(options?.source?.type as string);
        // @ts-expect-error param declared as `never` in foundry-vtt-types
        return cls?.validateJoint(changes);
    }

    public override toObject(value: TInitialized): TPersisted {
        return 'toObject' in (value as object) &&
            typeof (value as { toObject: unknown }).toObject === 'function'
            ? (value as { toObject: () => TPersisted }).toObject()
            : (foundry.utils.deepClone(value) as unknown as TPersisted);
    }
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
        PseudoDocumentClass & { new: (...args: any[]) => TDocument };
}
