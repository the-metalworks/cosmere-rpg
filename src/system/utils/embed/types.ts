export interface EmbedHelpers {
    buildEmbedHTML?(
        document: foundry.abstract.Document,
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | HTMLCollection | null>;
    createInlineEmbed?(
        document: foundry.abstract.Document,
        content: HTMLElement | HTMLCollection,
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null>;
    createFigureEmbed?(
        document: foundry.abstract.Document,
        content: HTMLElement | HTMLCollection,
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null>;
}
