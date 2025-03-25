import { SYSTEM_ID } from '../constants';
import { CosmereCombatant } from './combatant';

export class CosmereCombat extends Combat {
    declare turns: CosmereCombatant[];

    /**
     * Sets all defeated combatants activation status to true (already activated),
     * and all others to false (hasn't activated yet)
     */
    resetActivations() {
        for (const combatant of this.turns) {
            void combatant.setFlag(
                SYSTEM_ID,
                'activated',
                combatant.isDefeated ? true : false,
            );
            void combatant.setFlag(
                SYSTEM_ID,
                'bossFastActivated',
                combatant.isDefeated ? true : false,
            );
        }
    }

    override async startCombat(): Promise<this> {
        this.resetActivations();
        return super.startCombat();
    }

    override async nextRound(): Promise<this> {
        this.resetActivations();
        return super.nextRound();
    }
}
