import type { AnyMutableObject, AnyObject } from '@system/types/utils';
import type { Document } from '@system/types/foundry/document';

import { inPlaceMap } from '@system/utils/array';

type SystemEmbeddedCollectionsConfig = {
    [K in foundry.abstract.Document.Type]?: string;
};

type DocumentHierarchy = Record<
    string,
    | foundry.data.fields.EmbeddedCollectionField.Any
    | foundry.data.fields.EmbeddedDocumentField.Any
>;

declare class AnyEmbeddedCollection extends foundry.abstract.EmbeddedCollection<
    foundry.abstract.Document.Any,
    foundry.abstract.Document.Any
> {
    public _initializeDocument(
        data: foundry.abstract.Document.Any['_source'],
        options: foundry.abstract.Document.ConstructionContext<foundry.abstract.Document.Any>,
    ): foundry.abstract.Document.Any | null;
}

/**
 * Mixin to add system defined embedded collections to an existing document
 * To be able to embed a document, it must use the `SystemEmbeddableMixin`
 */
export function SystemEmbeddedCollectionsMixin<
    const DocumentClass extends Document.Constructable.SystemConstructor,
>(cls: DocumentClass, config: SystemEmbeddedCollectionsConfig) {
    return class SystemEmbeddedCollectionsDocument extends cls {
        // Markers to flag system embedded collection support
        public static readonly hasSystemEmbeddedCollections: true = true;
        public readonly hasSystemEmbeddedCollections: true = true;

        declare static __schema: foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>;
        private static _systemHierarchy?: DocumentHierarchy;
        private static _hierarchy?: DocumentHierarchy;

        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    systemEmbedded: config,
                },
                { inplace: false },
            ),
        );

        public static defineSchema() {
            const baseSchema = super.defineSchema();
            const systemField =
                baseSchema.system as foundry.data.fields.TypeDataField<DocumentClass>;

            return foundry.utils.mergeObject(
                {
                    system: new SystemCollectionsTypeDataField(
                        systemField.document,
                    ),
                },
                baseSchema,
            ) as unknown as typeof baseSchema;
        }

        public static defineSystemEmbeddedCollectionsSchema() {
            const embeddedDocumentNames = Object.keys(
                this.metadata.systemEmbedded,
            ) as foundry.abstract.Document.Type[];

            return embeddedDocumentNames.reduce(
                (schema, documentName) => ({
                    ...schema,
                    [this.metadata.systemEmbedded[documentName]!]:
                        new SystemEmbeddedCollectionField(
                            foundry.documents[`Base${documentName}`],
                        ),
                }),
                {} as foundry.data.fields.DataSchema,
            );
        }

        public static get schema(): foundry.data.fields.SchemaField<foundry.data.fields.DataSchema> {
            if (this.__schema) return this.__schema;

            const base = this.baseDocument;
            if (!base.hasOwnProperty('__schema')) {
                const schema = new foundry.data.fields.SchemaField(
                    this.defineSchema(),
                );
                Object.defineProperty(base, '__schema', {
                    value: schema,
                    writable: false,
                });
            }
            Object.defineProperty(this, '__schema', {
                value: (base as unknown as { __schema: unknown }).__schema,
                writable: false,
            });

            return this.__schema;
        }

        public static get hierarchy(): DocumentHierarchy {
            if (this._hierarchy) return this._hierarchy;

            const hierarchy: AnyMutableObject = {};
            this.schema
                .entries()
                .filter(
                    ([_, field]) =>
                        (
                            field.constructor as unknown as typeof foundry.data.fields.DataField
                        ).hierarchical,
                )
                .forEach(([fieldName, field]) => {
                    hierarchy[fieldName] = field;
                });

            /**
             * Append system embedded collection fields to overall hierarchy
             * This ensure broader comptability with Foundry's handling of
             * embedded collections.
             */
            this._hierarchy = foundry.utils.mergeObject(
                hierarchy,
                this.systemHierarchy,
            );

            return this._hierarchy;
        }

        public static get systemHierarchy(): DocumentHierarchy {
            if (this._systemHierarchy) return this._systemHierarchy;

            const hierarchy: DocumentHierarchy = {};
            (
                this.schema.fields.system
                    .embeddedCollectionsSchema as foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>
            )
                .entries()
                .filter(
                    ([_, field]) =>
                        (
                            field.constructor as unknown as typeof foundry.data.fields.DataField
                        ).hierarchical,
                )
                .forEach(([fieldName, field]) => {
                    hierarchy[fieldName] =
                        field as foundry.data.fields.EmbeddedCollectionField.Any;
                });

            return (this._systemHierarchy = hierarchy);
        }

        protected _configure({
            pack = null,
            parentCollection = null,
        }: foundry.abstract.Document.ConfigureOptions = {}) {
            /**
             * Unfortunately we need to override and re-implement this whole function.
             * This is due to the fact that when constructing the Embedded Collections,
             * Foundry natively always grabs the source data directly by field name (`this._source[fieldName]`)
             * rather than doing a look up by fieldPath.
             * Additionally, Foundry seals the resulting collections object and makes it
             * non-writable.
             * All of this combined means the only way for us to inject our own Embedded Collections
             * and have them be treated like Embedded Collections by Foundry, is to re-implement
             * this function.
             */

            Object.defineProperty(this, 'parentCollection', {
                value: this._getParentCollection(
                    parentCollection as string | undefined,
                ),
                writable: false,
            });

            Object.defineProperty(this, 'pack', {
                value: (() => {
                    if (typeof pack === 'string') return pack;
                    if (this.parent?.pack) return this.parent.pack;
                    if (pack === null) return null;
                    throw new Error(
                        'The provided compendium pack ID must be a string',
                    );
                })(),
                writable: false,
            });

            // Construct Embedded Collections
            const collections: AnyMutableObject = {};
            for (const [fieldName, field] of Object.entries(
                (this.constructor as DocumentClass).hierarchy,
            )) {
                if (
                    !(
                        field.constructor as typeof foundry.data.fields.EmbeddedCollectionField
                    ).implementation
                )
                    continue;
                // This is the only change from native Foundry (`this._source[fieldName]`)
                const data = foundry.utils.getProperty(
                    this._source,
                    field.fieldPath,
                ) as object[];

                const c = (collections[fieldName] = new (
                    field.constructor as typeof foundry.data.fields.EmbeddedCollectionField
                ).implementation(fieldName, this, data));
                Object.defineProperty(this, fieldName, {
                    value: c,
                    writable: false,
                });
            }

            Object.defineProperty(this, 'collections', {
                value: Object.seal(collections),
                writable: false,
            });
        }

        public static *_initializationOrder() {
            const hierarchy = this.hierarchy;

            // Initialize non-hierarchical fields first
            for (const [name, field] of this.schema.entries()) {
                if (name in hierarchy) continue;
                yield [name, field];
            }

            // Initialize hierarchical fields last
            for (const [name, field] of Object.entries(hierarchy)) {
                if (!(name in this.schema.fields)) continue; // Check to skip system embedded collections
                yield [name, field];
            }
        }

        public static isNativeEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return (
                !!collectionName &&
                collectionName in this.hierarchy &&
                !(collectionName in this.systemHierarchy)
            );
        }

        public static isSystemEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return !!collectionName && collectionName in this.systemHierarchy;
        }

        public getEmbeddedCollectionField(embeddedName: string) {
            const collectionName = (
                this.constructor as DocumentClass
            ).getCollectionName(embeddedName as never);
            if (!collectionName)
                throw new Error(
                    `${embeddedName} is not a valid embedded Document within the ${this.documentName} Document`,
                );

            return (this.constructor as DocumentClass).hierarchy[
                collectionName
            ];
        }

        public async createEmbeddedDocuments(
            embeddedName: string,
            data: Object[],
            operation?: foundry.abstract.DatabaseBackend.CreateOperation<foundry.abstract.Document.AnyConstructor>,
        ) {
            if (
                (
                    this.constructor as typeof SystemEmbeddedCollectionsDocument
                ).isNativeEmbedding(embeddedName)
            ) {
                return super.createEmbeddedDocuments(
                    embeddedName as never,
                    data as never,
                    operation as never,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(
                embeddedName as never,
            ) as AnyEmbeddedCollection;

            const docs = data
                .map((d) => collection._initializeDocument(d, { parent: this }))
                .filter((v) => !!v);

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                } as never,
                { diff: false } as never,
            );

            return data.map(() => update);
        }

        public async updateEmbeddedDocuments(
            embeddedName: string,
            updates: AnyObject[] = [],
            operation: Partial<
                foundry.abstract.DatabaseBackend.UpdateOperation<foundry.abstract.Document.AnyConstructor>
            > = {},
        ) {
            if (
                (
                    this.constructor as typeof SystemEmbeddedCollectionsDocument
                ).isNativeEmbedding(embeddedName)
            ) {
                return super.updateEmbeddedDocuments(
                    embeddedName as never,
                    updates as never,
                    operation as never,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(
                embeddedName as never,
            ) as AnyEmbeddedCollection;

            updates.forEach((update) => {
                const doc = collection.get(update._id as string);
                if (!doc) return;

                doc.updateSource(update);
            });

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                } as never,
                { recursive: false, diff: false } as never,
            );

            return updates.map(() => update);
        }

        public async deleteEmbeddedDocuments(
            embeddedName: string,
            ids: string[],
            operation: Partial<foundry.abstract.DatabaseBackend.DeleteOperation> = {},
        ) {
            if (
                (
                    this.constructor as typeof SystemEmbeddedCollectionsDocument
                ).isNativeEmbedding(embeddedName)
            ) {
                return super.deleteEmbeddedDocuments(
                    embeddedName as never,
                    ids as never,
                    operation as never,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(
                embeddedName as never,
            ) as AnyEmbeddedCollection;

            ids.forEach((id) => collection.delete(id));

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                } as never,
                { recursive: false, diff: false } as never,
            );

            return ids.map(() => update);
        }
    } as unknown as typeof cls;
}

/**
 * Identical to Foundry's native EmbeddedCollectionField, but
 * overrides the _cleanType function to use in-place mapping of the array.
 * This prevents issues where the source data reference of the collection
 * diverges from the document source data.
 *
 * This is also more in-line with Foundry's general approach of mutating
 * source data in-place rather than replacing references.
 */
class SystemEmbeddedCollectionField<
    const ElementFieldType extends foundry.abstract.Document.AnyConstructor,
    const ParentDataModel extends foundry.abstract.Document.Any,
> extends foundry.data.fields.EmbeddedCollectionField<
    ElementFieldType,
    ParentDataModel
> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    protected override _cleanType(
        value: any,
        options: foundry.data.fields.DataField.CleanOptions & {
            recursive?: boolean;
        } = {},
    ) {
        if (options.recursive === false)
            options = { ...options, partial: false };
        return inPlaceMap(value, (v: any) =>
            this._cleanElement(v, options),
        ) as any;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

class SystemCollectionsTypeDataField<
    const SystemDocument extends foundry.abstract.Document.SystemConstructor,
> extends foundry.data.fields.TypeDataField<SystemDocument> {
    private static _embeddedCollectionsSchemas = new Map<
        foundry.abstract.Document.Type,
        foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>
    >();

    declare document: SystemDocument & {
        defineSystemEmbeddedCollectionsSchema(): foundry.data.fields.DataSchema;
    };

    public defineEmbeddedCollectionsSchema(): foundry.data.fields.DataSchema {
        return this.document.defineSystemEmbeddedCollectionsSchema();
    }

    public get documentName() {
        return super.documentName as foundry.abstract.Document.SystemType;
    }

    public get embeddedCollectionsSchema() {
        if (
            !SystemCollectionsTypeDataField._embeddedCollectionsSchemas.has(
                this.document.documentName,
            )
        ) {
            SystemCollectionsTypeDataField._embeddedCollectionsSchemas.set(
                this.document.documentName,
                new foundry.data.fields.SchemaField(
                    this.defineEmbeddedCollectionsSchema(),
                    undefined as never,
                    {
                        name: 'system',
                    },
                ),
            );
        }

        return SystemCollectionsTypeDataField._embeddedCollectionsSchemas.get(
            this.document.documentName,
        )!;
    }

    public getModelForType(type: string) {
        let cls = super.getModelForType(type);
        if (!cls) return null;

        if (!('__systemEmbeddedCollections' in cls)) {
            const embeddedCollectionsSchema =
                this.defineEmbeddedCollectionsSchema();

            cls = CONFIG[this.documentName].dataModels[type] =
                class System extends cls {
                    // Marker to flag system embedded collection support
                    public static __systemEmbeddedCollections = true;
                    private static _combinedSchema?: foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>;

                    public static get combinedSchema() {
                        return (this._combinedSchema ??=
                            new foundry.data.fields.SchemaField(
                                foundry.utils.mergeObject(
                                    super.defineSchema(),
                                    embeddedCollectionsSchema,
                                ) as foundry.data.fields.DataSchema,
                            ));
                    }

                    public static cleanData(
                        source: AnyObject = {},
                        options: foundry.data.fields.DataField.CleanOptions = {},
                    ) {
                        return this.combinedSchema.clean(source, options);
                    }
                };
        }

        return cls;
    }

    public override initialize(
        value: SystemCollectionsTypeDataField.PersistedType<SystemDocument>,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        const result = super.initialize(value, model, options);

        const embeddedSchema = this.embeddedCollectionsSchema;
        embeddedSchema.initialize(value, model, options);

        return result;
    }

    public override _updateDiff(
        source: AnyMutableObject,
        key: string,
        value: unknown,
        difference: AnyObject,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ) {
        // Embedded Collections
        const embeddedSchema = this.embeddedCollectionsSchema;
        const embeddedDifference = structuredClone(difference);
        embeddedSchema._updateDiff(
            source,
            key,
            value,
            embeddedDifference,
            options,
        );

        // System DataModel
        super._updateDiff(source, key, value, difference, options);

        // Merge differences
        foundry.utils.mergeObject(difference, embeddedDifference);
    }

    public override _updateCommit(
        source: AnyMutableObject,
        key: string,
        value: unknown,
        difference: AnyObject,
        options?: foundry.abstract.DataModel.UpdateOptions,
    ) {
        // System DataModel
        super._updateCommit(source, key, value, difference, options);

        // Embedded Collections
        const embeddedSchema = this.embeddedCollectionsSchema;
        embeddedSchema._updateCommit(source, key, value, difference, options);
    }

    public override _validateType(
        value: SystemCollectionsTypeDataField.InitializedType<SystemDocument>,
        options: foundry.data.fields.DataField.ValidateOptions<foundry.data.fields.DataField.Any> = {},
    ) {
        const result = super._validateType(value, options);
        if (result !== undefined) return result;

        // Embedded Collections
        const embeddedSchema = this.embeddedCollectionsSchema;
        return embeddedSchema.validate(value, options);
    }
}

namespace SystemCollectionsTypeDataField {
    export type InitializedType<
        SystemDocument extends foundry.abstract.Document.SystemConstructor,
        Options extends
            foundry.data.fields.TypeDataField.Options<SystemDocument> = foundry.data.fields.TypeDataField.DefaultOptions,
    > = foundry.data.fields.TypeDataField.InitializedType<
        SystemDocument,
        Options
    >;

    export type PersistedType<
        SystemDocument extends foundry.abstract.Document.SystemConstructor,
        Options extends
            foundry.data.fields.TypeDataField.Options<SystemDocument> = foundry.data.fields.TypeDataField.DefaultOptions,
    > = foundry.data.fields.TypeDataField.PersistedType<
        SystemDocument,
        Options
    >;
}
