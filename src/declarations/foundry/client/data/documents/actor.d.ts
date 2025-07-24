declare namespace Actor {
    interface ToggleStatusEffectOptions {
        /**
         * Force the effect to be active or inactive regardless of its current state
         */
        active?: boolean;

        /**
         * Display the toggled effect as an overlay
         * @default false
         */
        overlay?: boolean;
    }
}

declare class Actor<
    D extends foundry.abstract.DataModel = foundry.abstract.DataModel,
    I extends Item = Item,
> extends _ClientDocumentMixin<D>(foundry.documents.BaseActor<D>) {
    public readonly type: string;
    public readonly name: string;
    public readonly img: string;
    public readonly system: D;

    /**
     * The statuses that are applied to this actor by active effects
     */
    statuses: Set<string>;

    get items(): Collection<I>;
    get effects(): Collection<ActiveEffect>;
    get appliedEffects(): ActiveEffect[];

    /**
     * Return a data object which defines the data schema against which dice rolls can be evaluated.
     * By default, this is directly the Actor's system data, but systems may extend this to include additional properties.
     * If overriding or extending this method to add additional properties, care must be taken not to mutate the original
     * object.
     */
    public getRollData(): object;

    /**
     * Toggle a configured status effect for the Actor.
     * @param statusId  A status effect ID defined in CONFIG.statusEffects
     * @param options   Additional options which modify how the effect is created
     * @returns         A promise which resolves to one of the following values:
     *                  - ActiveEffect if a new effect need to be created
     *                  - true if was already an existing effect
     *                  - false if an existing effect needed to be removed
     *                  - undefined if no changes need to be made
     */
    public toggleStatusEffect(
        statusId: string,
        options?: Actor.ToggleStatusEffectOptions,
    ): Promise<ActiveEffect | boolean | undefined>;

    /**
     * Get all ActiveEffects that may apply to this Actor.
     * If CONFIG.ActiveEffect.legacyTransferral is true, this is equivalent to actor.effects.contents.
     * If CONFIG.ActiveEffect.legacyTransferral is false, this will also return all the transferred ActiveEffects on any
     * of the Actor's owned Items.
     * @yields {ActiveEffect}
     */
    public *allApplicableEffects(): Generator<ActiveEffect, void, void>;

    /**
     * Determine default artwork based on the provided actor data.
     * @param actorData     The source actor data.
     * @returns             Candidate actor image and prototype token artwork.
     */
    public static getDefaultArtwork(actorData: object): {
        img: string;
        texture: { src: string };
    };

    /**
     * Handle how changes to a Token attribute bar are applied to the Actor.
     * This allows for game systems to override this behavior and deploy special logic.
     * @param {string} attribute    The attribute path
     * @param {number} value        The target attribute value
     * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false)
     * @param {boolean} isBar       Whether the new value is part of an attribute bar, or just a direct value
     * @returns {Promise<documents.Actor>}  The updated Actor document
     */
    public async modifyTokenAttribute(
        attribute,
        value,
        isDelta,
        isBar,
    ): Promise<Actor | undefined>;
}
