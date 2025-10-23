declare interface ClientDocument {
    /**
     * Create a content link for this Document.
     * @param options - Additional options to configure how the link is constructed.
     */
    // options: not null (parameter default only)
    toAnchor(options?: TextEditor.EnrichmentAnchorOptions): HTMLAnchorElement;
}