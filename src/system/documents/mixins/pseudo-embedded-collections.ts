export function PseudoEmbeddedCollectionsMixin<
    // const ConcreteDocumentName extends PseudoEmbeddedCollectionMixin.ConcreteDocumentType,
    const SystemDocument,
>(cls: SystemDocument) {
    // const cls = CONFIG[concreteDocumentName].documentClass;

    return class extends (cls as any) {
        declare static __schema: any;

        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    pseudoEmbedded: {
                        Item: 'items', // TEMP
                    },
                },
                { inplace: false },
            ),
        );

        public static defineSchema() {
            const baseSchema = super.defineSchema();
            const systemField = baseSchema.system;

            console.log('PseudoEmbeddedCollectionsMixin defineSchema', {
                baseSchema,
                systemField,
            });

            return foundry.utils.mergeObject(baseSchema, {
                system: new PseudoCollectionsTypeDataField(
                    systemField.document,
                ),
            }) as unknown as typeof baseSchema;
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

        // protected override _configure(
        //     options: foundry.abstract.Document.ConfigureOptions = {}
        // ) {

        // }
    } as unknown as typeof cls;
}

class PseudoCollectionsTypeDataField<
    const SystemDocument extends foundry.abstract.Document.SystemConstructor,
> extends foundry.data.fields.TypeDataField<SystemDocument> {
    private static modelsForType: Record<
        string,
        foundry.abstract.DataModel.AnyConstructor | null
    > = {};

    public override getModelForType(
        type: string,
    ): foundry.abstract.DataModel.AnyConstructor | null {
        if (!type) return null;

        if (!PseudoCollectionsTypeDataField.modelsForType[type]) {
            let model = super.getModelForType(type);

            if (model) {
                model = class extends model {
                    declare static __schema: (typeof model)['_schema'];

                    public static defineSchema() {
                        const baseSchema = super.defineSchema();

                        return foundry.utils.mergeObject(baseSchema, {
                            pseudoCollections:
                                new foundry.data.fields.SchemaField({
                                    items: new foundry.data.fields.EmbeddedCollectionField(
                                        foundry.documents.BaseItem,
                                    ),
                                }),
                        }) as unknown as typeof baseSchema;
                    }

                    public static get schema() {
                        if (this.__schema) return this.__schema;
                        const schema = new foundry.data.fields.SchemaField(
                            this.defineSchema(),
                        );
                        Object.defineProperty(this, '__schema', {
                            value: schema,
                            writable: false,
                        });
                        return this.__schema;
                    }
                };
            }

            PseudoCollectionsTypeDataField.modelsForType[type] = model;
        }

        return PseudoCollectionsTypeDataField.modelsForType[type];
    }
}

export namespace PseudoEmbeddedCollectionMixin {
    export type ConcreteDocumentType = 'Item';
}
