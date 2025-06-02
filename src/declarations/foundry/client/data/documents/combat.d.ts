declare namespace Combat {
    export type ConfiguredInstance = Combat;

    interface CombatHistoryData {
        round: number | null;
        turn: number | null;
        tokenId: string | null;
        combatantId: string | null;
    }
}

declare class Combat<
    C extends Combatant = Combatant,
    Schema extends foundry.abstract.DataSchema = foundry.abstract.DataSchema,
    Parent extends Document | null = foundry.abstract.Document.Any,
> extends _ClientDocumentMixin<D>(
    foundry.documents.BaseCombat<Schema, Parent>,
) {
    system: Schema;
    combatants: Collection<C>;

    turn: number | null;

    /**
     * Track the sorted turn order of this combat encounter
     */
    turns: C[];

    /**
     * Record the current round, turn, and tokenId to understand changes in the encounter state
     * @type {CombatHistoryData}
     */
    current: Combat.CombatHistoryData;

    /**
     * Track the previous round, turn, and tokenId to understand changes in the encounter state
     */
    previous?: Combat.CombatHistoryData;

    /**
     * Begin the combat encounter, advancing to round 1 and turn 1
     */
    async startCombat(): Promise<this>;

    /**
     * Advance the combat to the next round
     */
    async nextRound(): Promise<this>;

    /**
     * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
     */
    async endCombat(): Promise<this>;

    /**
     * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
     */
    setupTurns(): C[];

    /**
     * Get the current history state of the Combat encounter.
     * @param combatant       The new active combatant
     */
    protected _getCurrentState(combatant: C): Combat.CombatHistoryData;
}
