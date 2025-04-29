import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { HandlerType, Event } from '@system/types/item/events';

interface GrantItemsHandlerConfigData {
    /**
     * The UUIDs of the items to grant
     */
    items: string[];
}

// TODO: Localization
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.GrantItems,
        label: 'Grant Items',
        configSchema: {
            // We may want to move schema definition to data folder
            items: new foundry.data.fields.ArrayField(
                new foundry.data.fields.DocumentUUIDField({
                    type: 'Item',
                }),
                {
                    required: true,
                    initial: [],
                    label: 'Items',
                    hint: 'Items to grant',
                },
            ),
        },
        executor: async function (
            this: GrantItemsHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            // Get the items to grant
            const items = (
                (await Promise.all(
                    this.items.map((uuid) => fromUuid(uuid)),
                )) as (CosmereItem | null)[]
            ).filter((v) => !!v);

            // Grant the items to the actor
            await event.item.actor.createEmbeddedDocuments(
                'Item',
                items.map((item) => item.toObject()),
            );

            // Notify the user
            items.forEach((item) => {
                ui.notifications.info(
                    `Granted item ${item.name} to actor ${event.item.actor!.name}`,
                );
            });
        },
    });
}
