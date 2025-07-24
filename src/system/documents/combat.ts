import { TurnSpeed } from '@system/types/cosmere';

import { CosmereCombatant } from './combatant';

// Constants
import { SYSTEM_ID } from '@system/constants';

export class CosmereCombat extends Combat<CosmereCombatant> {
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
        return super.nextRound();
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
            .sort(this._sortCombatants);

        if (this.turn !== null)
            this.turn = Math.clamp(this.turn, 0, turns.length - 1);

        // Update state tracking
        const c = turns[this.turn!];
        this.current = this._getCurrentState(c);

        // One-time initialization of the previous state
        if (!this.previous) this.previous = this.current;

        // Return the array of prepared turns
        return (this.turns = turns);
    }
}
