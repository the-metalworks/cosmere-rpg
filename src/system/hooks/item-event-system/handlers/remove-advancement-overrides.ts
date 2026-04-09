import { SYSTEM_ID } from '@src/system/constants';
import { Event, HandlerType } from '@src/system/types/item/event-system';

interface RemoveAdvancementOverridesHandlerConfigData {
    uuid?: string | null;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.RemoveAdvancementOverrides,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveAdvancementOverrides}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveAdvancementOverrides}.Description`,
        config: {
            schema: {
                uuid: new foundry.data.fields.StringField({
                    required: false,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveAdvancementOverrides}.UUID.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveAdvancementOverrides}.UUID.Hint`,
                }),
            },
        },
        executor: async function (
            this: RemoveAdvancementOverridesHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            const actor = event.item.actor;
            if (!actor.isCharacter()) return;

            // NOTE: falsy coalescing here just in case the provided uuid is an empty string
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const sourceId = this.uuid || event.item.uuid;

            await actor.update(
                {
                    system: {
                        advancement: {
                            overrides:
                                actor.system.advancement.overrides.filter(
                                    (override) => override.source !== sourceId,
                                ),
                        },
                    },
                },
                event.op,
            );
        },
    });
}
