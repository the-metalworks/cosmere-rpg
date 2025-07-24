import { CosmereActor } from '@system/documents/actor';
import { HandlerType, Event } from '@system/types/item/event-system';

import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

// Utils
import { getChangeValue, tryApplyRollData } from '@system/utils/changes';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const enum UpdateActorTarget {
    Parent = 'parent', // The parent actor of the item
    Global = 'global', // An actor specified by UUID
}

interface UpdateActorHandlerConfigData {
    target: UpdateActorTarget;
    uuid?: string | null;
    changes: ChangeData[];
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.UpdateActor,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Description`,
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [UpdateActorTarget.Parent]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Target.Choices.${UpdateActorTarget.Parent}`,
                        [UpdateActorTarget.Global]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Target.Choices.${UpdateActorTarget.Global}`,
                    },
                    initial: UpdateActorTarget.Parent,
                    required: true,
                    blank: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Target.Label`,
                }),
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Actor',
                    initial: null,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.UUID.Label`,
                }),
                changes: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField(
                        ChangeDataModel.defineSchema(),
                    ),
                    {
                        required: true,
                        initial: [],
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateActor}.Changes.Label`,
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_UPDATE_ACTOR}`,
        },
        executor: async function (
            this: UpdateActorHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.changes.length === 0) return;
            if (this.target === UpdateActorTarget.Global && !this.uuid) return;

            // Get the actor
            const actor =
                this.target === UpdateActorTarget.Global
                    ? ((await fromUuid(this.uuid!)) as CosmereActor | null)
                    : event.item.actor;
            if (!actor) return;

            // Construct changes object
            const changes = this.changes.reduce(
                (acc, change) => ({
                    ...acc,
                    [change.key]: getChangeValue(
                        tryApplyRollData(
                            foundry.utils.mergeObject(actor.getRollData(), {
                                event: {
                                    source: {
                                        item: event.item.getRollData(),
                                    },
                                },
                            }),
                            change,
                        ),
                        actor,
                    ),
                }),
                {},
            );

            // Update the actor
            await actor.update(changes, event.op);
        },
    });
}
