import type { EmbeddedTypesOf, DocumentOfType } from '@system/types/utils';

export type EphemeralEmbeddedDocumentsConfig<
    DocumentName extends foundry.abstract.Document.WithSubTypes,
> = Partial<
    Record<
        foundry.abstract.Document.SubTypesOf<DocumentName> | 'base',
        {
            [EmbeddedName in EmbeddedTypesOf<DocumentName>]?: (
                this: DocumentOfType<DocumentName>,
            ) => DocumentOfType<EmbeddedName>[];
        }
    >
>;
