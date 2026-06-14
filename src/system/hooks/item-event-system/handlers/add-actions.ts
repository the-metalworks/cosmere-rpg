import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';

// Utils
import { matchDocuments } from '@system/utils/match-document';

// Fields
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const SCHEMA = {
    matchDocument: new MatchDocumentField({
        type: 'Item',
        required: true,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Target.Label`,
    }),
    uuids: new foundry.data.fields.ArrayField(
        new foundry.data.fields.DocumentUUIDField({
            type: 'Item',
        }),
        {
            required: true,
            initial: [],
            label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Uuids.Label`,
            placeholder: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Uuids.Placeholder`,
        },
    ),
    allowDuplicates: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.AllowDuplicates.Label`,
        hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.AllowDuplicates.Hint`,
    }),
    notify: new foundry.data.fields.BooleanField({
        required: false,
        initial: true,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Notify.Label`,
        hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Notify.Hint`,
    }),
} as const;

type AddActionsData = foundry.data.fields.SchemaField.InitializedData<
    typeof SCHEMA
> & {
    matchDocument: MatchDocumentField.InitializedType;
};

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.AddActions,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Description`,
        config: {
            schema: SCHEMA,
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_ADD_ACTIONS}`,
        },
        executor: async function (this: AddActionsData, event: Event) {
            // Get matched items
            const items = (
                await matchDocuments({
                    ...this.matchDocument,
                    relativeTo: event.item,
                })
            ).filter((doc) => doc instanceof CosmereItem);
            if (items.length === 0) return;

            const actions = (
                await Promise.all(this.uuids.map((uuid) => fromUuid(uuid)))
            ).filter((doc) => doc instanceof CosmereItem && doc.isAction());

            for (const item of items) {
                const actionsToAdd = actions.filter(
                    (actionA) =>
                        this.allowDuplicates ||
                        item.actions.every(
                            (actionB) =>
                                actionB.system.id !== actionA.system.id,
                        ),
                );

                for (const action of actionsToAdd) {
                    //@ts-expect-error foundry-vtt-types won't correctly resolve modified Item.Parent type
                    await Item.create(action.toObject(), { parent: item });

                    if (this.notify) {
                        ui.notifications.info(
                            game.i18n.format(
                                'GENERIC.Notification.AddedActionToItem',
                                {
                                    action: action.name,
                                    item: item.name,
                                },
                            ),
                        );
                    }
                }
            }
        },
    });
}
