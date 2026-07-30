import { TurnSpeed } from '@system/types/cosmere';

import { CosmereCombatant } from './combatant';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';

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
        const combat = super.startCombat();

        const newRound = this.round;

        Hooks.callAll(HOOKS.COMBAT_ROUND_START, this, {
            newRound,
        });
        return combat;
    }

    override async nextRound(): Promise<this> {
        this.resetActivations();

        const previousRound = this.round;

        Hooks.callAll(HOOKS.COMBAT_ROUND_END, this, {
            previousRound,
        });

        const combat = await super.nextRound();

        const newRound = this.round;

        Hooks.callAll(HOOKS.COMBAT_ROUND_START, this, {
            newRound,
        });
        return combat;
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
}

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface DocumentClassConfig {
        Combat: typeof CosmereCombat;
    }

    interface ConfiguredCombat<SubType extends Combat.SubType> {
        document: CosmereCombat;
    }
}
