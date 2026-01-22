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

export declare class AnyEmbeddedCollection extends foundry.abstract
    .EmbeddedCollection<
    foundry.abstract.Document.Any,
    foundry.abstract.Document.Any
> {
    public _initializeDocument(
        data: foundry.abstract.Document.Any['_source'],
        options: foundry.abstract.Document.ConstructionContext<foundry.abstract.Document.Any>,
    ): foundry.abstract.Document.Any | null;
}
