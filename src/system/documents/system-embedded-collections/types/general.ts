import type {
    AnyMutableObject,
    AnyEmbeddedCollection,
} from '@system/types/utils';

export type SystemEmbeddedCollectionsConfig = {
    [K in foundry.abstract.Document.Type]?: string;
};

export interface SystemEmbeddedCollectionsDocumentConstructor
    extends foundry.abstract.Document.AnyConstructor {
    hasSystemEmbeddedCollections: true;
    isNativeEmbedding(embeddedName: string): boolean;
    isSystemEmbedding(embeddedName: string): boolean;
    metadata: foundry.abstract.Document.Metadata.Any & {
        systemEmbedded: SystemEmbeddedCollectionsConfig;
    };
}

export interface SystemEmbeddedCollectionsDocument
    extends foundry.abstract.Document.Any {
    constructor: SystemEmbeddedCollectionsDocumentConstructor;
    hasSystemEmbeddedCollections: true;
    isNativeEmbedding(embeddedName: string): boolean;
    isSystemEmbedding(embeddedName: string): boolean;
    getCollectionName(
        embeddedName: foundry.abstract.Document.Type,
    ): string | null;
    getEmbeddedCollection(
        embeddedName: foundry.abstract.Document.Type,
    ): AnyEmbeddedCollection | null;
}

export type AnyDocumentData = AnyMutableObject & {
    _id: string;
};
