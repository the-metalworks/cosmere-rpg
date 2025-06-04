declare class Combatant<
    Schema extends foundry.abstract.DataSchema = foundry.abstract.DataSchema,
    Parent extends Document | null = foundry.abstract.Document.Any,
> extends _ClientDocumentMixin<D>(
    foundry.documents.BaseCombatant<Schema, Parent>,
) {
    system: Schema;

    /**
     * A convenience alias of Combatant#parent which is more semantically intuitive
     */
    get combat(): Combat | null;

    /**
     * This is treated as a non-player combatant if it has no associated actor and no player users who can control it
     */
    get isNPC(): boolean;

    /**
     * A reference to the Actor document which this Combatant represents, if any
     */
    get actor(): Actor | null;

    /**
     * A reference to the Token document which this Combatant represents, if any
     */
    get token(): TokenDocument | null;

    /**
     * An array of non-Gamemaster Users who have ownership of this Combatant.
     */
    get players(): User[];

    /**
     * Has this combatant been marked as defeated?
     */
    get isDefeated(): boolean;

    /* -------------------------------------------- */

    /**
     * Get a Roll object which represents the initiative roll for this Combatant.
     * @param formula           An explicit Roll formula to use for the combatant.
     * @returns                 The unevaluated Roll instance to use for the combatant.
     */
    public getInitiativeRoll(formula?: string): Roll;

    /**
     * Roll initiative for this particular combatant.
     * @param formula           A dice formula which overrides the default for this Combatant.
     * @returns                 The updated Combatant.
     */
    public async rollInitiative(formula?: string): Promise<this>;

    /**
     * Acquire the default dice formula which should be used to roll initiative for this combatant.
     * Modules or systems could choose to override or extend this to accommodate special situations.
     * @returns                 The initiative formula to use for this combatant.
     */
    protected _getInitiativeFormula(): string;
}
