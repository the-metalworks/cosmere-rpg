import { ActorType, AdversaryRole, TurnSpeed } from '@system/types/cosmere';

// Data
import { CombatantDataModel } from '@system/data/combatant';

// Documents
import { AdversaryActor, CosmereActor } from './actor';

let _schema: foundry.data.fields.SchemaField | undefined;

export class CosmereCombatant extends Combatant<CombatantDataModel> {
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
        if (this.system.turnSpeed === TurnSpeed.Fast) initiative += 1000;
        return initiative;
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
            this.system.turnSpeed === TurnSpeed.Slow
                ? TurnSpeed.Fast
                : TurnSpeed.Slow;

        // Update the turn speed
        await this.update({
            'system.turnSpeed': newSpeed,
        });
    }

    public async markActivated(bossFastActivated = false) {
        if (bossFastActivated && this.isBoss) {
            await this.update({
                'system.bossFastActivated': true,
            });
        } else {
            await this.update({
                'system.activated': true,
            });
        }
    }

    public async resetActivation() {
        await this.update({
            'system.activated': false,
            'system.bossFastActivated': false,
        });
    }
}
