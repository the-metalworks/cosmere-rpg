import type { Document } from '@system/types/foundry/document';

import type {
    SystemEmbeddedCollectionsConfig,
    SystemEmbeddedCollectionsDocumentConstructor,
} from './types/general';

/* eslint-disable no-prototype-builtins */

export function SystemEmbeddedCollectionsMixin<
    const DocumentClass extends Document.Constructable.SystemConstructor,
>(cls: DocumentClass, config: SystemEmbeddedCollectionsConfig) {
    return class SystemEmbeddedCollectionsDocument extends cls {
        // Markers to flag system embedded collection support
        public static readonly hasSystemEmbeddedCollections = true as const;
        public readonly hasSystemEmbeddedCollections = true as const;

        declare static __schema: foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>;

        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    embedded: config,
                    systemEmbedded: config,
                },
                { inplace: false },
            ),
        );

        public static defineSchema() {
            const baseSchema = super.defineSchema();

            return foundry.utils.mergeObject(
                (
                    Object.entries(config) as [
                        foundry.abstract.Document.Type,
                        string,
                    ][]
                ).reduce(
                    (schema, [embeddedName, collectionName]) => ({
                        ...schema,
                        [collectionName]: new PseudoEmbeddedCollectionField(
                            foundry.documents[`Base${embeddedName}`],
                        ),
                    }),
                    {},
                ),
                baseSchema,
            ) as unknown as typeof baseSchema;
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

        public static isNativeEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return (
                !!collectionName &&
                embeddedName in this.metadata.embedded &&
                !(embeddedName in this.metadata.systemEmbedded)
            );
        }

        public isNativeEmbedding(embeddedName: string): boolean {
            return (
                this.constructor as unknown as SystemEmbeddedCollectionsDocument
            ).isNativeEmbedding(embeddedName);
        }

        public static isSystemEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return (
                !!collectionName && embeddedName in this.metadata.systemEmbedded
            );
        }

        public isSystemEmbedding(embeddedName: string): boolean {
            return (
                this.constructor as unknown as SystemEmbeddedCollectionsDocument
            ).isSystemEmbedding(embeddedName);
        }

        public getCollectionName(embeddedName: foundry.abstract.Document.Type) {
            return (
                this
                    .constructor as unknown as SystemEmbeddedCollectionsDocumentConstructor
            ).getCollectionName(embeddedName as never);
        }
    };
}

class PseudoEmbeddedCollectionField<
    const ElementFieldType extends foundry.abstract.Document.AnyConstructor,
    const ParentDataModel extends foundry.abstract.Document.Any,
> extends foundry.data.fields.EmbeddedCollectionField<
    ElementFieldType,
    ParentDataModel
> {
    public override apply<Value, Options, Return>(
        fn:
            | keyof this
            | ((this: this, value: Value, options: Options) => Return),
        value?: Value,
        options?: Options,
    ): Return {
        // Prevent recursive invocations
        const applied =
            (
                options as
                    | { _applied?: foundry.data.fields.DataField.Any[] }
                    | undefined
            )?._applied ?? ([] as foundry.data.fields.DataField.Any[]);
        if (applied.includes(this)) return value as unknown as Return;
        else
            return super.apply(fn, value, {
                ...options,
                _applied: [...applied, this],
            } as Options);
    }
}

/* eslint-enable no-prototype-builtins */
