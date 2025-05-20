import { CosmereActor } from '@system/documents/actor';
import { HandlerType, Event } from '@system/types/item/events';

import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

// Utils
import { getChangeValue } from '@system/utils/changes';

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

// TODO: Localize
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.UpdateActor,
        label: 'Update Actor',
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [UpdateActorTarget.Parent]: 'Parent Actor',
                        [UpdateActorTarget.Global]: 'Global',
                    },
                    initial: UpdateActorTarget.Parent,
                    required: true,
                    blank: false,
                    label: 'Target',
                }),
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Actor',
                    initial: null,
                    nullable: true,
                    label: 'Actor',
                }),
                changes: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField(
                        ChangeDataModel.defineSchema(),
                    ),
                    {
                        required: true,
                        initial: [],
                        label: 'Changes',
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

            console.log('Updating actor', actor.name);

            // Construct changes object
            const changes = this.changes.reduce(
                (acc, change) => ({
                    ...acc,
                    [change.key]: getChangeValue(change, actor),
                }),
                {},
            );

            console.log('Changes', changes);

            // Update the actor
            await actor.update(changes);
        },
    });
}
