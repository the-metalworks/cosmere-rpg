import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialog
import { EditExpertisesDialog } from '../../dialogs/edit-expertises';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../../base';

export class CharacterExpertisesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_EXPERTISES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-expertises': this.onEditExpertises,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onEditExpertises(this: CharacterExpertisesComponent) {
        await EditExpertisesDialog.show(this.application.actor);
    }

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

// Register
CharacterExpertisesComponent.register('app-character-expertises');
