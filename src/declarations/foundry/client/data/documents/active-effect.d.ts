declare namespace ActiveEffect {
    interface EffectChangeData {
        /**
         * The attribute path in the Actor or Item data which the change modifies
         */
        key: string;

        /**
         * The value of the change effect
         */
        value: string;

        /**
         * The modification mode with which the change is applied
         */
        mode: number;

        /**
         *  The priority level with which this change is applied
         */
        priortity: number;
    }

    interface EffectDurationData {
        /**
         * The world time when the active effect first started
         */
        startTime: number | null;

        /**
         * The maximum duration of the effect, in seconds
         */
        seconds: number | null;

        /**
         * The _id of the CombatEncounter in which the effect first started
         */
        combat: string;

        /**
         * The maximum duration of the effect, in combat rounds
         */
        rounds: number | null;

        /**
         * The maximum duration of the effect, in combat turns
         */
        turns: number | null;

        /**
         * The round of the CombatEncounter in which the effect first started
         */
        startRound: number | null;

        /**
         * The turn of the CombatEncounter in which the effect first started
         */
        startTurn: number | null;
    }

    interface ActiveEffectData {
        /**
         * The _id that uniquely identifies the ActiveEffect within its parent collection
         */
        _id: string;

        /**
         * The name of the which describes the name of the ActiveEffect
         */
        name: string;

        /**
         * An image path used to depict the ActiveEffect as an icon
         */
        img: string;

        /**
         * The array of EffectChangeData objects which the ActiveEffect applies
         */
        changes: EffectChangeData[];

        /**
         * Is this ActiveEffect currently disabled?
         * @default false
         */
        disabled: boolean;

        /**
         * An EffectDurationData object which describes the duration of the ActiveEffect
         */
        duration: Partial<EffectDurationData>;

        /**
         * The HTML text description for this ActiveEffect document.
         */
        description: string;

        /**
         * A UUID reference to the document from which this ActiveEffect originated
         */
        origin: string;

        /**
         * A color string which applies a tint to the ActiveEffect icon
         */
        tint: string | null;

        /**
         * Does this ActiveEffect automatically transfer from an Item to an Actor?
         * @default true
         */
        transfer: boolean;

        /**
         * Special status IDs that pertain to this effect
         */
        statuses: Set<string>;

        /**
         * An object of optional key/value flags
         */
        flags: object;
    }

    interface FromStatusEffectOptions {
        /**
         * The parent Document of this one, if this one is embedded
         */
        parent?: foundry.abstract.Document | null;

        /**
         * The compendium collection ID which contains this Document, if any
         */
        pack?: string | null;

        /**
         * Whether to validate initial data strictly?
         * @default true
         */
        strict?: boolean;
    }
}

declare class ActiveEffect<
    D extends foundry.abstract.DataModel = foundry.abstract.DataModel,
> extends _ClientDocumentMixin<D>(foundry.documents.BaseActiveEffect<D>) {
    /**
     * Create an ActiveEffect instance from some status effect ID.
     * Delegates to {@link ActiveEffect._fromStatusEffect} to create the ActiveEffect instance
     * after creating the ActiveEffect data from the status effect data of `CONFIG.statusEffects`.
     * @param statusId  The status effect ID.
     * @param options   Additional options to pass to the ActiveEffect constructor.
     * @returns         The created ActiveEffect instance.
     * @throws          An error if there is no status effect in `CONFIG.statusEffects`
     *                  with the given status ID and if the status has implicit statuses
     *                  but doesn't have a static _id.
     */
    static async fromStatusEffect(
        statusId: string,
        options?: ActiveEffect.FromStatusEffectOptions,
    ): Promise<ActiveEffect>;

    /**
     * Create an ActiveEffect instance from status effect data.
     * Called by {@link ActiveEffect.fromStatusEffect}.
     * @param statusId      The status effect ID.
     * @param effectData    The status effect data.
     * @param options       Additional options to pass to the ActiveEffect constructor.
     * @returns             The created ActiveEffect instance.
     */
    protected static async _fromStatusEffect(
        statusId: string,
        effectData: Partial<ActiveEffect.ActiveEffectData>,
        options?: ActiveEffect.FromStatusEffectOptions,
    ): Promise<ActiveEffect>;

    public readonly type: string;
    public readonly name: string;
    public readonly system: D;
    public disabled: boolean;
    public origin: string | null;
    public duration: ActiveEffect.EffectDurationData;
    public statuses: Set<string>;

    /**
     * Is there some system logic that makes this active effect ineligible for application?
     */
    get isSuppressed(): boolean;

    /**
     * Retrieve the Document that this ActiveEffect targets for modification
     */
    get target(): foundry.abstract.Document | null;

    /**
     * Whether the Active Effect currently applying its changes to the target.
     */
    get active(): boolean;

    /**
     * Does this Active Effect currently modify an Actor?
     */
    get modifiesActor(): boolean;

    /**
     * Describe whether the ActiveEffect has a temporary duration based on combat turns or rounds.
     */
    get isTemporary(): boolean;

    /**
     * The source name of the Active Effect. The source is retrieved synchronously.
     * Therefore "Unknown" (localized) is returned if the origin points to a document inside a compendium.
     * Returns "None" (localized) if it has no origin, and "Unknown" (localized) if the origin cannot be resolved.
     */
    get sourceName(): string;

    /**
     * Apply this ActiveEffect to a provided Actor.
     * @param actor     The Actor to whom this effect should be applied
     * @param change    The change data being applied
     * @returns          An object of property paths and their updated values.
     */
    public apply(
        actor: Actor,
        change: ActiveEffect.EffectChangeData,
    ): Record<string, any>;

    /**
     * Display changes to active effects as scrolling Token status text.
     * @param {boolean} enabled     Is the active effect currently enabled?
     */
    protected _displayScrollingStatus(enabled: boolean);
}
