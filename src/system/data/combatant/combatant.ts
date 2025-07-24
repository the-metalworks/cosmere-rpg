import { ActorType, AdversaryRole, TurnSpeed } from '@system/types/cosmere';
import { CosmereCombatant } from '@system/documents/combatant';

export interface CombatantData {
    /**
     * The turn speed type of the combatant, either slow or fast.
     */
    turnSpeed: TurnSpeed;

    /**
     * Whether or not the combatant has acted this turn.
     */
    activated: boolean;

    /**
     * Whether or not the boss combatant has acted on its fast turn.
     * This is only used for boss adversaries.
     */
    bossFastActivated?: boolean;
}

export class CombatantDataModel extends foundry.abstract.TypeDataModel<
    CombatantData,
    CosmereCombatant
> {
    static defineSchema() {
        return {
            turnSpeed: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: TurnSpeed.Slow,
                choices: [TurnSpeed.Slow, TurnSpeed.Fast],
            }),
            activated: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
            }),
            bossFastActivated: new foundry.data.fields.BooleanField({
                required: false,
            }),
        };
    }
}
