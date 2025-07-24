import { HandlerType, Event } from '@system/types/item/event-system';
import { Expertise } from '@system/data/actor/common';

// Fields
import { ExpertisesField } from '@system/data/actor/fields/expertises-field';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface RemoveExpertiseHandlerConfigData {
    /**
     * The expertises to remove
     */
    expertises: Collection<Expertise>;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.RemoveExpertises,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveExpertises}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveExpertises}.Description`,
        config: {
            schema: {
                expertises: new ExpertisesField({
                    required: true,
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_REMOVE_EXPERTISES}`,
        },
        executor: async function (
            this: RemoveExpertiseHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.expertises.size === 0) return;

            // Get the actor
            const actor = event.item.actor;

            // Get the expertises to grant (filter out any the actor already has)
            const expertises = this.expertises.filter((expertise) =>
                actor.hasExpertise(expertise),
            );

            // Remove the expertises
            await actor.update(
                {
                    'system.expertises': expertises.reduce(
                        (acc, expertise) => ({
                            ...acc,
                            [`-=${expertise.key}`]: expertise.toObject(),
                        }),
                        {},
                    ),
                },
                event.op,
            );
        },
    });
}
