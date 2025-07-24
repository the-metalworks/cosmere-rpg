import { HandlerType, Event } from '@system/types/item/event-system';

import { ConstructorOf } from '@system/types/utils';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface ExecuteMacroHandlerConfigData {
    inline: boolean;
    uuid?: string | null;
    macro?: {
        type: 'chat' | 'script';
        command: string;
    } | null;
}

export function register() {
    // Get the macro schema
    const macroSchema = (
        CONFIG.Macro
            .documentClass as unknown as typeof foundry.abstract.DataModel
    ).defineSchema();

    // Re-assign type field label
    macroSchema.type.label = `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ExecuteMacro}.MacroType.Label`;
    (macroSchema.type as foundry.data.fields.StringField).choices = () =>
        CONFIG.Macro.typeLabels;

    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.ExecuteMacro,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ExecuteMacro}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ExecuteMacro}.Description`,
        config: {
            schema: {
                inline: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ExecuteMacro}.Inline.Label`,
                }),
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Macro',
                    initial: null,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ExecuteMacro}.UUID.Label`,
                }),
                macro: new foundry.data.fields.SchemaField(
                    {
                        type: macroSchema.type,
                        command: macroSchema.command,
                    },
                    {
                        nullable: true,
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_EXECUTE_MACRO}`,
        },
        executor: async function (
            this: ExecuteMacroHandlerConfigData,
            event: Event,
        ) {
            // Get the macro to execute
            const macro = !this.inline
                ? this.uuid // Not inline, so we need to get the macro from the UUID
                    ? ((await fromUuid(this.uuid)) as Macro | null)
                    : null
                : this.macro // Inline, so we need to create a new ephemeral macro document from the macro data
                  ? (new (CONFIG.Macro
                        .documentClass as unknown as ConstructorOf<foundry.abstract.DataModel>)(
                        {
                            ...this.macro,
                            name: 'Event Inline Macro',
                        },
                    ) as unknown as Macro)
                  : null;

            // If no macro is found, return
            if (!macro) return;

            // Execute the macro
            await macro.execute({
                actor: event.item.actor,
                event,
            });
        },
    });
}
