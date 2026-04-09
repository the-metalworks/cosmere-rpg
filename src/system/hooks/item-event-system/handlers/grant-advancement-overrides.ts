import { SYSTEM_ID } from '@system/constants';
import {
    AdvancementOverrideData,
    AdvancementOverrideDataModel,
} from '@system/data/item/misc/advancement-override';
import { Advancement } from '@system/types/advancement';
import { Event, HandlerType } from '@system/types/item/event-system';
import AdvancementManager from '@system/utils/advancement';

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

            const newOverrides = [...actor.system.advancement.overrides];
            this.overrides.forEach((override) => {
                // Transform event data into schema data and insert by priority
                AdvancementManager.insertOverrideIntoList(
                    {
                        ...override,
                        source: event.item.uuid,
                    } as AdvancementOverrideData,
                    newOverrides,
                );
            });

            await actor.update(
                {
                    system: {
                        advancement: {
                            overrides: newOverrides,
                        },
                    },
                },
                event.op,
            );
        },
    });
}
