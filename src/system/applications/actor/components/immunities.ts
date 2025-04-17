import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialog
import { EditImmunitiesDialog } from '../dialogs/edit-immunities';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { Condition, DamageType } from '@src/system/types/cosmere';

export class ActorImmunitiesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_IMMUNITIES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-immunities': this.onEditImmunities,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onEditImmunities(this: ActorImmunitiesComponent) {
        await EditImmunitiesDialog.show(this.application.actor);
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            immunities: [
                ...Object.entries(
                    this.application.actor.system.immunities?.damage,
                ).map(([immunityName, value]) => ({
                    name: immunityName,
                    label: CONFIG.COSMERE.damageTypes[
                        immunityName as DamageType
                    ].label,
                    isImmune: value,
                    typeLabel: CONFIG.COSMERE.immunityTypes.damage.label,
                })),
                ...Object.entries(
                    this.application.actor.system.immunities?.condition,
                ).map(([immunityName, value]) => ({
                    name: immunityName,
                    label: CONFIG.COSMERE.conditions[immunityName as Condition]
                        .label,
                    isImmune: value,
                    typeLabel: CONFIG.COSMERE.immunityTypes.condition.label,
                })),
            ],
        });
    }
}

// Register
ActorImmunitiesComponent.register('app-actor-immunities');
