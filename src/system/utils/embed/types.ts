export interface EmbedHelpers {
    buildEmbedHTML?(
        document: foundry.abstract.Document.Any,
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | HTMLCollection | null>;
    createInlineEmbed?(
        document: foundry.abstract.Document.Any,
        content: HTMLElement | HTMLCollection,
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null>;
    createFigureEmbed?(
        document: foundry.abstract.Document.Any,
        content: HTMLElement | HTMLCollection,
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null>;
}
