import { AdversaryRole, TurnSpeed } from '@system/types/cosmere';

// Documents
import { CosmereActor } from './actor';

// Constants
import { SYSTEM_ID } from '@system/constants';

import { AnyMutableObject } from '@league-of-foundry-developers/foundry-vtt-types/utils';

let _schema:
    | foundry.data.fields.SchemaField<CosmereCombatant.Schema>
    | undefined;

export class CosmereCombatant extends Combatant {
    public static defineSchema() {
        const schema = super.defineSchema() as CosmereCombatant.Schema &
            Partial<Pick<Combatant.Schema, 'initiative'>>;
        // Remove the initiative field from the schema as we handle it using a getter
        delete schema.initiative;
        return schema as Combatant.Schema;
    }

    public static get schema() {
        if (!_schema) {
            _schema = new foundry.data.fields.SchemaField(this.defineSchema());
        }
        return _schema as foundry.data.fields.SchemaField<Combatant.Schema>;
    }

    protected static override async _preUpdateOperation(
        documents: Combatant.Implementation[],
        operation: CosmereCombatant.Database.Update,
        user: User.Implementation,
    ): Promise<boolean | void> {
        const newChanges: Combatant.UpdateData[] = [];

        // These are a set of keys the system wants never to be propagated between combatant turns
        let noPropagateKeys = [`system`, `flags.${SYSTEM_ID}`];
        if (operation.propagateIgnoreKeys) {
            // If the operation had instructions to ignore any more keys of the update, add those here
            noPropagateKeys = noPropagateKeys.concat(
                operation.propagateIgnoreKeys,
            );
        }
        for (const update of operation.updates) {
            if (!update._id) {
                // This changed document for some reason doesn't have an ID, ignore it.
                continue;
            }
            const changedCombatant: CosmereCombatant = documents.find(
                (combatant) => {
                    return combatant.id === update._id;
                },
            )!;
            if (!changedCombatant.linkedCombatantIds) {
                // This combatant has no duplicate combatants, continue
                continue;
            }
            for (const linkedCombatantId of changedCombatant.linkedCombatantIds) {
                // Clone the update data and change the id property to point to the linked combatant
                const linkedCombatantUpdate = foundry.utils.deepClone(
                    update,
                ) as AnyMutableObject;
                linkedCombatantUpdate._id = linkedCombatantId;
                for (const key of noPropagateKeys) {
                    foundry.utils.deleteProperty(linkedCombatantUpdate, key);
                }

                // Check to make sure this update contains useful information
                for (const key of Object.keys(linkedCombatantUpdate)) {
                    if (key !== '_id' && key !== '_stats') {
                        // If the update has a key other than the _id property or the _stats property, this update contains useful data
                        // TODO: Check to make sure there is a non-empty object within the update information
                        documents.push(
                            changedCombatant.parent.getEmbeddedDocument(
                                'Combatant',
                                linkedCombatantId,
                                { strict: true },
                            )!,
                        );
                        newChanges.push(linkedCombatantUpdate);
                        break;
                    }
                }
            }
        }
        for (const newChange of newChanges) {
            operation.updates.push(newChange);
        }

        return Promise.resolve(true);
    }

    /* --- Accessors --- */

    override get actor(): CosmereActor {
        return super.actor!;
    }

    public get isBoss(): boolean {
        return (
            this.actor.isAdversary() &&
            this.actor.system.role === AdversaryRole.Boss
        );
    }

    public get initiative(): number {
        const spd = this.actor.system.attributes.spd;
        let initiative = spd.value + spd.bonus;
        if (this.actor.isCharacter()) initiative += 500;
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

    public get linkedCombatantIds(): string[] | undefined {
        return this.getFlag(SYSTEM_ID, 'linkedCombatantIds') ?? undefined;
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
            flags: {
                [SYSTEM_ID]: {
                    activated: false,
                    bossFastActivated: false,
                },
            },
        });
    }
}

export namespace CosmereCombatant {
    export type Schema = Omit<Combatant.Schema, 'initiative'>;
    export namespace Database {
        export interface Update extends Combatant.Database.Update {
            noLinkPropagate?: boolean;
            propagateIgnoreKeys?: string[];
        }
    }
}

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface ConfiguredCombatant<SubType extends Combatant.SubType> {
        document: CosmereCombatant;
    }

    interface FlagConfig {
        Combatant: {
            [SYSTEM_ID]: {
                turnSpeed: TurnSpeed;
                bossFastActivated: boolean;
                activated: boolean;
                linkedCombatantIds: string[];
            };
        };
    }
}
