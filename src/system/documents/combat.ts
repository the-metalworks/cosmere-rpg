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
        await this.update({ round: this.round, turn: null });

        return super.nextRound();
    }

    override async nextTurn(): Promise<this> {
        // The Cosmere RPG doesn't have an easy programmatic "next turn",
        // so we should reset the combat tracker to be no-one's turn when
        // the nextTurn button is pressed.
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
        };

        await this.update(updateData, updateOptions);
        return this;
    }

    override setupTurns(): CosmereCombatant[] {
        this.turns ??= [];
        let currTurnId: string | undefined | null;
        if (this.current) {
            currTurnId = this.current.combatantId;
        }

        const turns = Array.from(this.combatants).sort(
            this._sortCombatants.bind(this),
        );

        // Update state tracking
        if (this.current) {
            const c = turns.find((combatant) => {
                return combatant.id == currTurnId;
            });
            this.current = this._getCurrentState(c);
        }

        if (this.turn !== null)
            this.turn = Math.clamp(this.turn, 0, turns.length - 1);

        // One-time initialization of the previous state
        if (!this.previous) this.previous = this.current;

        // Assign turns
        this.turns = turns;

        // Return the array of prepared turns
        return this.turns;
    }

    override async _onEnter(combatant: CosmereCombatant) {
        // If the combatant is a boss, clone it to create a fast turn beside its slow turn
        if (combatant.isBoss && combatant.turnSpeed == TurnSpeed.Slow) {
            const createData: Combatant.CreateData = {
                tokenId: combatant.tokenId,
                sceneId: combatant.sceneId,
                actorId: combatant.actorId,
                hidden: combatant.hidden,
                flags: {
                    [SYSTEM_ID]: {
                        turnSpeed: TurnSpeed.Fast,
                    },
                },
            };
            void (await this.createLinkedCombatants(combatant, [createData]));
        }
    }

    async createLinkedCombatants(
        combatant: CosmereCombatant,
        data: Combatant.CreateData[],
    ) {
        const linkedCombatants: CosmereCombatant[] =
            await this.createEmbeddedDocuments('Combatant', data);
        const linkedCombatantIds: string[] = [combatant.id!];
        for (const linkedCombatant of linkedCombatants) {
            linkedCombatantIds.push(linkedCombatant.id!);
        }
        void (await combatant.setFlag(
            SYSTEM_ID,
            'linkedCombatantIds',
            linkedCombatantIds.filter((id) => id !== combatant.id),
        ));
        for (const linkedCombatant of linkedCombatants) {
            void (await linkedCombatant.setFlag(
                SYSTEM_ID,
                'linkedCombatantIds',
                linkedCombatantIds.filter((id) => id !== linkedCombatant.id),
            ));
        }
    }

    public async setCurrentTurnFromCombatant(combatant: CosmereCombatant) {
        const turnIndex = this.turns.indexOf(combatant);

        if (turnIndex !== -1) {
            const updateData = { round: this.round, turn: turnIndex };
            const updateOptions = {
                advanceTime: 0,
                direction: 1,
            };
            Hooks.callAll('combatTurn', this, updateData, updateOptions);
            await this.update(
                updateData,
                updateOptions as Combat.Database.UpdateOperation,
            );
        }
    }
}

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface ConfiguredCombat<SubType extends Combat.SubType> {
        document: CosmereCombat;
    }
}
