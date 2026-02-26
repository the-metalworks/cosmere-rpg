import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class ActorEncumbranceListComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ENCUMBRANCE_LIST}`;

    public _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        const actor = this.application.actor;

        // Sum weights of physical items (quantity * weight.value)
        const physicalItems = actor.items.filter((i) => i.isPhysical());
        const currentWeight = physicalItems
            .reduce((sum, it) => {
                const qty = Number(it.system.quantity ?? 0);
                const w = Number(it.system.weight?.value ?? 0);
                return sum + qty * w;
            }, 0)
            .toFixed(2);

        const carryLimit =
            actor.system.encumbrance?.carry?.derived ??
            actor.system.encumbrance?.carry?.value ??
            0;

        return Promise.resolve({
            ...context,
            currentWeight,
            carryLimit,
        });
    }
}

ActorEncumbranceListComponent.register('app-actor-encumbrance-list');
