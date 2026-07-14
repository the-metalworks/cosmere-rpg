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
        private ephemeralUpdate = false;

        declare type: foundry.abstract.Document.SubTypesOf<DocumentType>;

        declare static metadata: foundry.abstract.Document.MetadataFor<DocumentType> & {
            ephemeralEmbedded: EphemeralEmbeddedDocumentsConfig<DocumentType>;
        };

        public prepareData() {
            /* eslint-disable @typescript-eslint/no-unsafe-call */
            //@ts-expect-error foundry-vtt-types doesn't define the prepareData function on the Document base class (only client document)
            super.prepareData();
            /* eslint-enable @typescript-eslint/no-unsafe-call */

            if (!this.ephemeralUpdate) this.injectEphemeralDocuments();
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
            const changes: AnyMutableObject = {};

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

                    const ephemeralDocuments = generatorFn.call(
                        this as unknown as DocumentOfType<DocumentType>,
                    );
                    const concreteDocuments = (
                        Array.from(collection) as DocumentOfType<DocumentType>[]
                    ).filter(
                        (doc) =>
                            !foundry.utils.getProperty(
                                doc,
                                `flags.${SYSTEM_ID}.meta.isEphemeral`,
                            ),
                    );

                    changes[field] = [
                        ...ephemeralDocuments.map((doc) =>
                            foundry.utils.mergeObject(doc.toObject(), {
                                flags: {
                                    [SYSTEM_ID]: {
                                        meta: {
                                            isEphemeral: true,
                                        },
                                    },
                                },
                            }),
                        ),
                        ...concreteDocuments.map((doc) => doc.toObject()),
                    ];
                } catch (err) {
                    Logger.error(
                        'ephemeralEmbeddedDocuments',
                        `Error occured while setting epehemeral embedded documents for ${this.uuid} ${field}`,
                        err,
                    );
                }
            });

            if (Object.keys(changes).length === 0) return;

            this.ephemeralUpdate = true;

            // Call updateSource and set each collection to an empty array to prevent ephemeral documents from being ordered after concrete documents
            this.updateSource(
                Object.keys(changes).reduce(
                    (acc, field) => ({
                        ...acc,
                        [field]: [],
                    }),
                    {} as AnyObject,
                ),
                { recursive: false },
            );

            // Call updateSource with actual data to set collections to correct state
            this.updateSource(changes, { recursive: false });

            this.ephemeralUpdate = false;
        }
    };
}
