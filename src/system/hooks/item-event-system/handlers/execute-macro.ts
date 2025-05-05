import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { HandlerType, Event } from '@system/types/item/events';

interface ExecuteMacroHandlerConfigData {
    uuid: string | null;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.ExecuteMacro,
        label: 'Execute Macro',
        config: {
            schema: {
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Macro',
                    required: true,
                    initial: null,
                    label: 'Macro',
                }),
            },
        },
        executor: async function (
            this: ExecuteMacroHandlerConfigData,
            event: Event,
        ) {
            if (!this.uuid) return;

            // Get the macro to execute
            const macro = (await fromUuid(this.uuid)) as Macro | null;
            if (!macro) return;

            // Execute the macro
            await macro.execute({
                actor: event.item.actor,
                event,
            });
        },
    });
}
