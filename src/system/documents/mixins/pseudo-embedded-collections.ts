import type { AnyMutableObject, AnyObject } from '@system/types/utils';

/**
 * Mixin to add system define embedded collections to an existing document
 * To be able to embed a document, it must use the `SystemEmbeddableMixin`
 */
export function PseudoEmbeddedCollectionsMixin<
    const DocumentClass extends foundry.abstract.Document.WithSystem,
>(cls: DocumentClass) {
    return class extends (cls as any) {
        // Markers to flag system embedded collection support
        public static readonly hasSystemEmbeddedCollections: true = true;
        public readonly hasSystemEmbeddedCollections: true = true;

        declare static __schema: any;
        private static _systemHierarchy?: AnyObject;
        private static _hierarchy?: AnyObject;

        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    systemEmbedded: {
                        Item: 'items', // TEMP
                    },
                },
                { inplace: false },
            ),
        );

        public static defineSchema() {
            const baseSchema = super.defineSchema();
            const systemField = baseSchema.system;

            return foundry.utils.mergeObject(
                {
                    system: new SystemCollectionsTypeDataField(
                        systemField.document,
                    ),
                },
                baseSchema,
            ) as unknown as typeof baseSchema;
        }

        public static defineSystemEmbeddedCollectionSchema() {
            const embeddedDocumentNames = Object.keys(
                this.metadata.systemEmbedded,
            ) as foundry.abstract.Document.Type[];

            return embeddedDocumentNames.reduce(
                (schema, documentName) => ({
                    ...schema,
                    [this.metadata.systemEmbedded[documentName]]:
                        new PseudoEmbeddedCollectionField(
                            foundry.documents[`Base${documentName}`],
                        ),
                }),
                {} as foundry.data.fields.DataSchema,
            );
        }

        public static get schema() {
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

        public static get hierarchy() {
            if (this._hierarchy) return this._hierarchy;

            const hierarchy: AnyMutableObject = {};
            this.schema
                .entries()
                .filter(
                    ([_, field]: [any, any]) => field.constructor.hierarchical,
                )
                .forEach(([fieldName, field]: [string, any]) => {
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

        public static get systemHierarchy() {
            if (this._systemHierarchy) return this._systemHierarchy;

            const hierarchy: AnyMutableObject = {};
            this.schema.fields.system.schema
                .entries()
                .filter(
                    ([_, field]: [any, any]) => field.constructor.hierarchical,
                )
                .forEach(([fieldName, field]: [string, any]) => {
                    hierarchy[fieldName] = field;
                });

            this._systemHierarchy = hierarchy;
            return this._systemHierarchy;
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
             * not writable.
             * All of this combined means the only way for us to inject our own Embedded Collections
             * and have them be treated like Embedded Collections by Foundry, is to re-implement
             * this function.
             */

            Object.defineProperty(this, 'parentCollection', {
                value: this._getParentCollection(parentCollection),
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
                (this.constructor as any).hierarchy as Record<string, any>,
            )) {
                if (!field.constructor.implementation) continue;
                // This is the only change from native Foundry (`this._source[fieldName]`)
                const data = foundry.utils.getProperty(
                    this._source,
                    field.fieldPath,
                );
                const c = (collections[fieldName] =
                    new field.constructor.implementation(
                        fieldName,
                        this,
                        data,
                    ));
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
            const collectionName = this.getCollectionName(embeddedName);
            return (
                collectionName in this.hierarchy &&
                !(collectionName in this.systemHierarchy)
            );
        }

        public static isSystemEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(embeddedName);
            return collectionName in this.systemHierarchy;
        }

        public getEmbeddedCollectionField(embeddedName: string) {
            const collectionName = (this.constructor as any).getCollectionName(
                embeddedName,
            );
            if (!collectionName)
                throw new Error(
                    `${embeddedName} is not a valid embedded Document within the ${this.documentName} Document`,
                );

            return (this.constructor as any).hierarchy[collectionName];
        }

        public async createEmbeddedDocuments(
            embeddedName: string,
            data: Object[],
            operation: foundry.abstract.DatabaseBackend.CreateOperation<foundry.abstract.Document.AnyConstructor>,
        ) {
            if ((this.constructor as any).isNativeEmbedding(embeddedName)) {
                return super.createEmbeddedDocuments(
                    embeddedName,
                    data,
                    operation,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(embeddedName);

            data = data.map((d) =>
                collection._initializeDocument(d, { parent: this }),
            );

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                },
                { recursive: false, diff: false },
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
            if ((this.constructor as any).isNativeEmbedding(embeddedName)) {
                return super.updateEmbeddedDocuments(
                    embeddedName,
                    updates,
                    operation,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(embeddedName);

            updates.forEach((update) => {
                const doc = collection.get(update._id!);
                if (!doc) return;

                doc.updateSource(update);
            });

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                },
                { recursive: false, diff: false },
            );

            return updates.map(() => update);
        }

        public async deleteEmbeddedDocuments(
            embeddedName: string,
            ids: string[],
            operation: Partial<foundry.abstract.DatabaseBackend.DeleteOperation> = {},
        ) {
            if ((this.constructor as any).isNativeEmbedding(embeddedName)) {
                return super.deleteEmbeddedDocuments(
                    embeddedName,
                    ids,
                    operation,
                );
            }

            const collectionField =
                this.getEmbeddedCollectionField(embeddedName);
            const collection = this.getEmbeddedCollection(embeddedName);

            ids.forEach((id) => collection.delete(id));

            const update = await this.update(
                {
                    [collectionField.fieldPath]: collection.toObject(),
                },
                { recursive: false, diff: false },
            );

            return ids.map(() => update);
        }
    } as unknown as typeof cls;
}

class PseudoEmbeddedCollectionField<
    const ElementFieldType extends foundry.abstract.Document.AnyConstructor,
    const ParentDataModel extends foundry.abstract.Document.Any,
> extends foundry.data.fields.EmbeddedCollectionField<
    ElementFieldType,
    ParentDataModel
> {
    public override initialize(
        value: any,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        // Model is system, model.parent is the containing document
        return super.initialize(value, model.parent, options);
    }
}

class SystemCollectionsTypeDataField<
    const SystemDocument extends foundry.abstract.Document.SystemConstructor,
> extends foundry.data.fields.TypeDataField<SystemDocument> {
    private static modelsForType: Record<
        string,
        foundry.abstract.DataModel.AnyConstructor | null
    > = {};
    private static _sharedSchema: foundry.data.fields.SchemaField<
        ReturnType<typeof SystemCollectionsTypeDataField.defineSharedSchema>
    > | null = null;

    public static defineSharedSchema() {
        return {
            items: new PseudoEmbeddedCollectionField(
                foundry.documents.BaseItem,
            ),
        };
    }

    public static get sharedSchema() {
        if (!this._sharedSchema) {
            this._sharedSchema = new foundry.data.fields.SchemaField(
                this.defineSharedSchema(),
            );
        }
        return this._sharedSchema;
    }

    private _commonSchema: foundry.data.fields.SchemaField<
        ReturnType<typeof SystemCollectionsTypeDataField.defineSharedSchema>
    > | null = null;

    public get commonSchema() {
        if (!this._commonSchema) {
            this._commonSchema = new foundry.data.fields.SchemaField(
                SystemCollectionsTypeDataField.defineSharedSchema(),
            );
            this._commonSchema.parent = this;
        }

        return this._commonSchema;
    }

    public override getModelForType(
        type: string,
    ): foundry.abstract.DataModel.AnyConstructor | null {
        if (!type) return null;

        if (!SystemCollectionsTypeDataField.modelsForType[type]) {
            let model = super.getModelForType(type);

            if (model) {
                model = class extends model {
                    static __schema?: (typeof model)['_schema'];

                    public static get schema() {
                        if (this.__schema) return this.__schema;
                        const schema = new foundry.data.fields.SchemaField(
                            foundry.utils.mergeObject(
                                this.defineSchema(),
                                SystemCollectionsTypeDataField.defineSharedSchema(),
                            ),
                        );
                        this.__schema = schema;
                        return this.__schema;
                    }
                };
            }

            SystemCollectionsTypeDataField.modelsForType[type] = model;
        }

        return SystemCollectionsTypeDataField.modelsForType[type];
    }
}

export namespace PseudoEmbeddedCollectionMixin {
    // export type ConcreteDocumentType = 'Item';
    // export type DocumentClass = foundry.abstract.Document<foundry.abstract.Document.SystemType>
}
