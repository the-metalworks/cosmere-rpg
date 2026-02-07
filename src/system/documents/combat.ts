import { TurnSpeed } from '@system/types/cosmere';

import { CosmereCombatant } from './combatant';

// Constants
import { SYSTEM_ID } from '@system/constants';

export class CosmereCombat extends Combat {
    /**
     * Sets all defeated combatants activation status to true (already activated),
     * and all others to false (hasn't activated yet)
     */
    resetActivations() {
        this.turns.forEach((combatant) => void combatant.resetActivation());
    }

    override async startCombat(): Promise<this> {
        this.resetActivations();
        return super.startCombat();
    }

    override async nextRound(): Promise<this> {
        this.resetActivations();

        // Ensure that at the start of the round, it's no combatant's turn
        await this.update(
            { round: this.round, turn: null },
            { turnEvents: false },
        );

        return super.nextRound();
    }

    override async nextTurn(): Promise<this> {
        // The Cosmere RPG doesn't have an easy programmatic "next turn", so we should reset the combat tracker to be no-one's turn when the nextTurn button is pressed.
        if (this.turn === null) {
            return this;
        }
        let advanceTime;
        if (this.turns.length > this.turn + 1) {
            advanceTime = this.getTimeDelta(
                this.round,
                this.turn,
                this.round,
                this.turn + 1,
            );
        } else advanceTime = 0;
        const updateData = { round: this.round, turn: null };
        const updateOptions: Combat.Database.UpdateOperation = {
            direction: 1,
            worldTime: { delta: advanceTime },
            turnEvents: false,
            broadcast: true,
        };

        await this.update(updateData, updateOptions);
        return this;
    }

    override setupTurns(): CosmereCombatant[] {
        this.turns ??= [];

        const turns = Array.from(this.combatants)
            .flatMap((c) => {
                if (c.isBoss) {
                    // If the combatant is a boss, clone it to create a fast turn beside its slow turn
                    const clone = new (CONFIG.Combatant
                        .documentClass as unknown as new (
                        data: unknown,
                        options: unknown,
                    ) => CosmereCombatant)(
                        foundry.utils.mergeObject(c.toObject(), {
                            [`flags.${SYSTEM_ID}.turnSpeed`]: TurnSpeed.Fast,
                        }),
                        { parent: c.parent },
                    );
                    return [clone, c];
                } else {
                    return c;
                }
            })
            .sort(this._sortCombatants.bind(this));

        if (this.turn !== null)
            this.turn = Math.clamp(this.turn, 0, turns.length - 1);

        // Update state tracking
        const c = turns[this.turn!];
        this.current = this._getCurrentState(c);

        // One-time initialization of the previous state
        if (!this.previous) this.previous = this.current;

        // Assign turns
        this.turns = turns;

        // Return the array of prepared turns
        return this.turns;
    }

    public async setCurrentTurnFromCombatant(
        combatant: CosmereCombatant,
        isBossFastTurn = false,
    ) {
        let turnIndex: number;

        if (isBossFastTurn) {
            // Find the turn index that matches this combatant with a fast turn speed
            turnIndex = this.turns.findIndex(
                (turn: CosmereCombatant) =>
                    turn.id === combatant.id &&
                    turn.turnSpeed === TurnSpeed.Fast,
            );
        } else {
            // If it's not a boss fast turn, find the combatant
            turnIndex = this.turns.indexOf(combatant);
        }

        if (turnIndex !== -1) {
            const updateData = { round: this.round, turn: turnIndex };
            const updateOptions = {
                advanceTime: 0,
                direction: 1,
            };
            Hooks.callAll('combatTurn', this, updateData, updateOptions);
            await this.update(updateData);
        }
    }
}

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface ConfiguredCombat<SubType extends Combat.SubType> {
        document: CosmereCombat;
    }
}
