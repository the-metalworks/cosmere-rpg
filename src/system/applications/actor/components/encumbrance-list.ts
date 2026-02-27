import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { ConfigureCarryCapacityDialog } from '@src/system/applications/actor/dialogs/configure-carry-capacity';

export class ActorEncumbranceListComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ENCUMBRANCE_LIST}`;

    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'configure-carry-capacity': this.onConfigureCarryCapacity,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private static onConfigureCarryCapacity(
        this: ActorEncumbranceListComponent,
    ) {
        void ConfigureCarryCapacityDialog.show(this.application.actor);
    }

    public _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        const actor = this.application.actor;

        // Sum weights of physical items (quantity * weight.value)
        const physicalItems = actor.items.filter((i) => i.isPhysical());
        const currentWeightNumber = physicalItems.reduce((sum, it) => {
            const qty = Number(it.system.quantity ?? 0);
            const w = Number(it.system.weight?.value ?? 0);
            return sum + qty * w;
        }, 0);
        const currentWeight = currentWeightNumber.toFixed(2);

        const carryLimit = actor.system.encumbrance?.carry?.value ?? 0;

        const isOverCarry = currentWeightNumber > Number(carryLimit);

        return Promise.resolve({
            ...context,
            currentWeight,
            carryLimit,
            isOverCarry,
        });
    }
}

ActorEncumbranceListComponent.register('app-actor-encumbrance-list');
