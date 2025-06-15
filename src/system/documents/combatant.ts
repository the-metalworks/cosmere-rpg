import { ActorType, AdversaryRole, TurnSpeed } from '@system/types/cosmere';

// Documents
import { AdversaryActor, CosmereActor } from './actor';

// Constants
import { SYSTEM_ID } from '@system/constants';

let _schema: foundry.data.fields.SchemaField | undefined;

export class CosmereCombatant extends Combatant {
    public static defineSchema() {
        const schema = super.defineSchema();
        // Remove the initiative field from the schema as we handle it using a getter
        delete schema.initiative;
        return schema;
    }

    public static get schema() {
        if (!_schema) {
            _schema = new foundry.data.fields.SchemaField(this.defineSchema());
        }
        return _schema;
    }

    /* --- Accessors --- */

    override get actor(): CosmereActor {
        return super.actor as CosmereActor;
    }

    public get isBoss(): boolean {
        return (
            this.actor.isAdversary() &&
            (this.actor as AdversaryActor).system.role === AdversaryRole.Boss
        );
    }

    public get initiative(): number {
        const spd = this.actor.system.attributes.spd;
        let initiative = spd.value + spd.bonus;
        if (this.actor.type === ActorType.Character) initiative += 500;
        if (this.turnSpeed === TurnSpeed.Fast) initiative += 1000;
        return initiative;
    }

    public get turnSpeed(): TurnSpeed {
        return this.getFlag(SYSTEM_ID, 'turnSpeed') ?? TurnSpeed.Slow;
    }

    public get activated(): boolean {
        return this.getFlag(SYSTEM_ID, 'activated') ?? false;
    }

    public get bossFastActivated(): boolean {
        return this.getFlag(SYSTEM_ID, 'bossFastActivated') ?? false;
    }

    /* --- Life cycle --- */

    public override rollInitiative(): Promise<this> {
        // Initiative is static and does not require rolling
        return Promise.resolve(this);
    }

    /* --- System functions --- */

    /**
     * Utility function to flip the combatants current turn speed between slow and fast. It then updates initiative to force an update of the combat-tracker ui
     */
    public async toggleTurnSpeed() {
        const newSpeed =
            this.turnSpeed === TurnSpeed.Slow ? TurnSpeed.Fast : TurnSpeed.Slow;

        // Update the turn speed
        await this.setFlag(SYSTEM_ID, 'turnSpeed', newSpeed);
    }

    public async markActivated(bossFastActivated = false) {
        if (bossFastActivated && this.isBoss) {
            await this.setFlag(SYSTEM_ID, 'bossFastActivated', true);
        } else {
            await this.setFlag(SYSTEM_ID, 'activated', true);
        }
    }

    public async resetActivation() {
        await this.update({
            [`flags.${SYSTEM_ID}`]: {
                activated: false,
                bossFastActivated: false,
            },
        });
    }
}
