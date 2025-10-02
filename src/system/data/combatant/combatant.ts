import { TurnSpeed } from '@system/types/cosmere';
import { CosmereCombatant } from '@system/documents/combatant';

const SCHEMA = () => ({
    /**
     * The turn speed type of the combatant, either slow or fast.
     */
    turnSpeed: new foundry.data.fields.StringField({
        required: true,
        blank: false,
        initial: TurnSpeed.Slow,
        choices: [TurnSpeed.Slow, TurnSpeed.Fast],
    }),

    /**
     * Whether or not the combatant has acted this turn.
     */
    activated: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
    }),

    /**
     * Whether or not the boss combatant has acted on its fast turn.
     * This is only used for boss adversaries.
     */
    bossFastActivated: new foundry.data.fields.BooleanField({
        required: false,
    }),
});

export type CombatantDataSchema = ReturnType<typeof SCHEMA>;

export class CombatantDataModel extends foundry.abstract.TypeDataModel<
    CombatantDataSchema,
    CosmereCombatant
> {
    static defineSchema() {
        return SCHEMA();
    }
}
