declare type Mixin<
    MixinClass extends new (...args: any[]) => any,
    BaseClass extends abstract new (...args: any[]) => any,
> = BaseClass & MixinClass;

declare function _ClientDocumentMixin<
    Schema extends foundry.abstract.DataModel = foundry.abstract.DataModel,
    Parent extends foundry.abstract.Document | null = null,
    BaseClass extends typeof foundry.abstract.Document<Schema, Parent>,
>(base: BaseClass): Mixin<BaseClass, typeof ClientDocument>;

declare class ClientDocument {
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
    get sheet(): Application | foundry.applications.api.ApplicationV2 | null;

    /**
     * Apply transformations of derivations to the values of the source data object.
     * Compute data fields whose values are not stored to the database.
     *
     * Called before {@link ClientDocument#prepareDerivedData} in {@link ClientDocument#prepareData}.
     */
    public prepareBaseData();

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
}
