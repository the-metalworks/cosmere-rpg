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
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Target.Label`,
    }),
    uuids: new foundry.data.fields.ArrayField(
        new foundry.data.fields.DocumentUUIDField({
            type: 'Item',
        }),
        {
            required: true,
            initial: [],
            label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Uuids.Label`,
            placeholder: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Uuids.Placeholder`,
        },
    ),
    notify: new foundry.data.fields.BooleanField({
        required: false,
        initial: true,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Notify.Label`,
        hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Notify.Hint`,
    }),
} as const;

type RemoveActionsData = foundry.data.fields.SchemaField.InitializedData<
    typeof SCHEMA
> & {
    matchDocument: MatchDocumentField.InitializedType;
};

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.RemoveActions,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.RemoveActions}.Description`,
        config: {
            schema: SCHEMA,
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_REMOVE_ACTIONS}`,
        },
        executor: async function (this: RemoveActionsData, event: Event) {
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
                const actionsToRemove = item.items.filter(
                    (i) =>
                        i.isAction() &&
                        actions.some(
                            (action) => action.system.id === i.system.id,
                        ),
                );

                for (const action of actionsToRemove) {
                    await action.delete();

                    if (this.notify) {
                        ui.notifications.info(
                            game.i18n.format(
                                'GENERIC.Notification.RemovedActionFromItem',
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
