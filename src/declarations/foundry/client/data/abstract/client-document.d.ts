declare type Mixin<
    MixinClass extends new (...args: any[]) => any,
    BaseClass extends abstract new (...args: any[]) => any,
> = BaseClass & MixinClass;

/**
 * Configuration for embedding HTML Document content.
 */
declare interface DocumentHTMLEmbedConfig
    extends Record<string, string | boolean | number> {
    /** Any strings that did not have a key name associated with them. */
    values?: string[];

    /** Classes to attach to the outermost element. */
    classes?: string;

    /**
     * By default Documents are embedded inside a figure element. If this option is
     * passed, the embed content will instead be included as part of the rest of the
     * content flow, but still wrapped in a section tag for styling purposes.
     * @default false
     */
    inline?: boolean;

    /**
     * Whether to include a content link to the original Document as a citation. This
     * options is ignored if the Document is inlined.
     * @default true
     */
    cite?: boolean;

    /**
     * Whether to include a caption. The caption will depend on the Document being
     * embedded, but if an explicit label is provided, that will always be used as the
     * caption. This option is ignored if the Document is inlined.
     * @default true
     */
    caption?: boolean;

    /**
     * Controls whether the caption is rendered above or below the embedded content.
     * @default "bottom"
     */
    captionPosition?: 'top' | 'bottom';

    /** The label. */
    label?: string;
}

declare interface CreateDocumentLinkOptions {
    /**
     * A document to generate a link relative to.
     */
    relativeTo?: ClientDocument;

    /**
     * A custom label to use instead of the document's name.
     */
    label?: string;
}

declare function _ClientDocumentMixin<
    Schema extends foundry.abstract.DataModel = foundry.abstract.DataModel,
    Parent extends foundry.abstract.Document | null = null,
    BaseClass extends typeof foundry.abstract.Document<Schema, Parent>,
>(base: BaseClass): Mixin<BaseClass, typeof ClientDocument>;

declare class ClientDocument {
    readonly uuid: string;

    /**
     * A collection of Application instances which should be re-rendered whenever this document is updated.
     * The keys of this object are the application ids and the values are Application instances. Each
     * Application in this object will have its render method called by {@link Document#render}.
     */
    get apps(): Record<
        string,
        Application | foundry.applications.api.ApplicationV2<any, any, any>
    >;

    /**
     * Lazily obtain a FormApplication instance used to configure this Document, or null if no sheet is available.
     */
    get sheet():
        | Application
        | foundry.applications.api.ApplicationV2<any, any, any>
        | null;

    /**
     * Apply transformations of derivations to the values of the source data object.
     * Compute data fields whose values are not stored to the database.
     *
     * Called before {@link ClientDocument#prepareDerivedData} in {@link ClientDocument#prepareData}.
     */
    public prepareBaseData();

    /**
     * Prepare all embedded Document instances which exist within this primary Document.
     * @memberof ClientDocumentMixin#
     */
    public prepareEmbeddedDocuments();

    /**
     * Apply transformations of derivations to the values of the source data object.
     * Compute data fields whose values are not stored to the database.
     *
     * Called before {@link ClientDocument#prepareDerivedData} in {@link ClientDocument#prepareData}.
     */
    public prepareDerivedData();

    /**
     * Create a content link for this Document.
     * @param options Additional options to configure how the link is constructed.
     */
    public toAnchor(
        options?: Partial<TextEditor.EnrichmentAnchorOptions>,
    ): HTMLAnchorElement;

    /**
     * Convert a Document to some HTML display for embedding purposes.
     * @param config            Configuration for embedding behavior.
     * @param options           The original enrichment options for cases where the Document embed
     *                               content also contains text that must be enriched.
     * @returns                 A representation of the Document as HTML content, or null if such a
     *                          representation could not be generated.
     */
    public async toEmbed(
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOption,
    ): Promise<HTMLElement | null>;

    /**
     * A method that can be overridden by subclasses to customize embedded HTML generation.
     * @param config            Configuration for embedding behavior.
     * @param options           The original enrichment options for cases where the Document embed
     *                               content also contains text that must be enriched.
     * @returns                 Either a single root element to append, or a collection of
     *                          elements that comprise the embedded content.
     */
    protected async _buildEmbedHTML(
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOption,
    ): Promise<HTMLElement | HTMLCollection | null>;

    /**
     * A method that can be overridden by subclasses to customize inline embedded HTML generation.
     * @param content           The embedded content.
     * @param config            Configuration for embedding behavior.
     * @param options           The original enrichment options for cases where the Document embed
     *                          content also contains text that must be enriched.
     */
    protected async _createInlineEmbed(
        content: HTMLElement | HTMLCollection,
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null>;

    /**
     * A method that can be overridden by subclasses to customize the generation of the embed figure.
     * @param content           The embedded content.
     * @param config            Configuration for embedding behavior.
     * @param options           The original enrichment options for cases where the Document embed
     *                          content also contains text that must be enriched.
     */
    protected async _createFigureEmbed(
        content: HTMLElement | HTMLCollection,
        config: DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOption,
    ): Promise<HTMLElement | null>;

    /**
     * Create a content link for this document.
     * @param eventData         The parsed object of data provided by the drop transfer event.
     * @param options           Additional options to configure link generation.
     */
    protected _createDocumentLink(
        eventData: object,
        options?: CreateDocumentLinkOptions,
    ): string;

    /**
     * Handle clicking on a content link for this document.
     * @param event             The triggering click event.
     */
    protected _onClickDocumentLink(event: MouseEvent): any;

    /**
     * Serialize salient information about this Document when dragging it.
     * @returns                 An object of drag data.
     */
    public toDragData(): object;
}
