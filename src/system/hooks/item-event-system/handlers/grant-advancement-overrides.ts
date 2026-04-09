import { SYSTEM_ID } from '@src/system/constants';
import {
    AdvancementOverrideData,
    AdvancementOverrideDataModel,
} from '@src/system/data/item/misc/advancement-override';
import * as Advancement from '@src/system/types/advancement';
import { Event, HandlerType } from '@src/system/types/item/event-system';

interface GrantAdvancementOverridesHandlerConfigData {
    overrides: Advancement.OverrideData[];
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.GrantAdvancementOverrides,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantAdvancementOverrides}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantAdvancementOverrides}.Description`,
        config: {
            schema: {
                overrides: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField(
                        AdvancementOverrideDataModel.defineSchema(),
                    ),
                    {
                        required: true,
                        initial: [],
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantAdvancementOverrides}.Overrides.Label`,
                    },
                ),
            },
        },
        executor: async function (
            this: GrantAdvancementOverridesHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            const actor = event.item.actor;
            if (!actor.isCharacter()) return;

            const newOverrides = this.overrides.map(
                (override) =>
                    ({
                        ...override,
                        source: event.item.uuid,
                    }) as AdvancementOverrideData,
            );

            await actor.update(
                {
                    system: {
                        advancement: {
                            overrides:
                                actor.system.advancement.overrides.concat(
                                    newOverrides,
                                ),
                        },
                    },
                },
                event.op,
            );
        },
    });
}
