// Types
import type { Document } from '@system/types/foundry/document';
import type {
    EmbeddedTypesOf,
    DocumentTypeOf,
    AnyObject,
    AnyMutableObject,
    DocumentOfType,
} from '@system/types/utils';
import type { EphemeralEmbeddedDocumentsConfig } from './types';

// Utils
import { Logger } from '@system/utils/logger';

// Constants
import { SYSTEM_ID } from '@system/constants';

export function EphemeralEmbeddedDocumentsMixin<
    const DocumentClass extends Document.Constructable.SystemConstructor,
    const DocumentType extends
        foundry.abstract.Document.WithSubTypes = DocumentTypeOf<DocumentClass>,
    const InstanceType extends
        DocumentOfType<DocumentType> = DocumentOfType<DocumentType>,
>(cls: DocumentClass) {
    return class EphemeralEmbeddedDocumentsDocument extends cls {
        declare type: foundry.abstract.Document.SubTypesOf<DocumentType>;

        declare static metadata: foundry.abstract.Document.MetadataFor<DocumentType> & {
            ephemeralEmbedded: EphemeralEmbeddedDocumentsConfig<DocumentType>;
        };

        public prepareData() {
            /* eslint-disable @typescript-eslint/no-unsafe-call */
            //@ts-expect-error foundry-vtt-types doesn't define the prepareData function on the Document base class (only client document)
            super.prepareData();
            /* eslint-enable @typescript-eslint/no-unsafe-call */

            this.injectEphemeralDocuments();
        }

        protected injectEphemeralDocuments(): void {
            const constructor = this
                .constructor as unknown as typeof EphemeralEmbeddedDocumentsDocument;
            const metadata = constructor.metadata;

            const configForSubType =
                metadata.ephemeralEmbedded[this.type] ??
                metadata.ephemeralEmbedded.base;
            if (!configForSubType) return;

            const embedded = Object.entries(metadata.embedded) as [
                EmbeddedTypesOf<DocumentType>,
                string,
            ][];

            embedded.forEach(([embeddedName, field]) => {
                try {
                    const generatorFn = configForSubType[embeddedName] as (
                        this: DocumentOfType<DocumentType>,
                    ) => DocumentOfType<typeof embeddedName>[];
                    if (!generatorFn) return;

                    const collection = this.getEmbeddedCollection(
                        embeddedName as never,
                    ) as foundry.abstract.EmbeddedCollection<
                        DocumentOfType<typeof embeddedName>,
                        InstanceType
                    >;

                    const ephemeralDocuments = generatorFn
                        .call(this as unknown as DocumentOfType<DocumentType>)
                        .map((doc) => {
                            // Get document constructor
                            const cls = doc.constructor as new (
                                ...args: unknown[]
                            ) => DocumentOfType<EmbeddedTypesOf<DocumentType>>;

                            const data = foundry.utils.mergeObject(
                                doc.toObject(),
                                {
                                    _id: doc.id ?? foundry.utils.randomID(), // Ensure id is set
                                    flags: {
                                        [SYSTEM_ID]: {
                                            meta: {
                                                isEphemeral: true,
                                            },
                                        },
                                    },
                                },
                            );

                            // Create new instance of document so we can assign the parent
                            return new cls(data, { parent: this });
                        });
                    const concreteDocuments = (
                        Array.from(collection) as object[]
                    ).filter(
                        (doc) =>
                            !foundry.utils.getProperty(
                                doc,
                                `flags.${SYSTEM_ID}.meta.isEphemeral`,
                            ),
                    ) as DocumentOfType<EmbeddedTypesOf<DocumentType>>[];

                    collection.clear();
                    ephemeralDocuments.forEach((doc) => {
                        collection.set(doc.id!, doc, { modifySource: false });
                    });
                    concreteDocuments.forEach((doc) =>
                        collection.set(doc.id!, doc, { modifySource: false }),
                    );
                } catch (err) {
                    Logger.error(
                        'ephemeralEmbeddedDocuments',
                        `Error occured while setting epehemeral embedded documents for ${this.uuid} ${field}`,
                        err,
                    );
                }
            });
        }
    };
}
