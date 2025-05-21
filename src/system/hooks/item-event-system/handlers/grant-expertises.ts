import { HandlerType, Event } from '@system/types/item/event-system';
import { Expertise } from '@system/data/actor/common';

// Fields
import { ExpertisesField } from '@system/data/actor/fields/expertises-field';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface GrantExpertiseHandlerConfigData {
    /**
     * The expertises to grant
     */
    expertises: Collection<Expertise>;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.GrantExpertises,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.Title`,
        config: {
            schema: {
                expertises: new ExpertisesField({
                    required: true,
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_GRANT_EXPERTISES}`,
        },
        executor: async function (
            this: GrantExpertiseHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.expertises.size === 0) return;

            // Get the actor
            const actor = event.item.actor;

            // Get the expertises to grant (filter out any the actor already has)
            const expertises = this.expertises.filter(
                (expertise) => !actor.hasExpertise(expertise),
            );

            // Grant the expertises
            await actor.update({
                'system.expertises': expertises.reduce(
                    (acc, expertise) => ({
                        ...acc,
                        [expertise.key]: expertise.toObject(),
                    }),
                    {},
                ),
            });
        },
    });
}
