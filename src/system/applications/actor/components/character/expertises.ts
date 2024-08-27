import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsComponent } from '../../../mixins/component-handlebars-application-mixin';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../../base';

export class CharacterExpertisesComponent extends HandlebarsComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/actors/character/components/expertises.hbs';

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            expertises:
                this.application.actor.system.expertises?.map((expertise) => ({
                    ...expertise,
                    typeLabel:
                        CONFIG.COSMERE.expertiseTypes[expertise.type].label,
                })) ?? [],
        });
    }
}
