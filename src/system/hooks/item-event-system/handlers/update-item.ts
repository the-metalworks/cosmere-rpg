import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/events';

import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

// Utils
import { getChangeValue } from '@system/utils/changes';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const enum UpdateItemTarget {
    Self = 'self',
    Sibling = 'sibling',
    Global = 'global',
}

const enum MatchMode {
    Identifier = 'identifier',
    Name = 'name',
    UUID = 'uuid',
}

interface UpdateItemHandlerConfigData {
    target: UpdateItemTarget;
    uuid?: string | null;
    matchMode?: MatchMode | null;
    matchAll?: boolean | null;
    changes: ChangeData[];
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.UpdateItem,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Title`,
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [UpdateItemTarget.Self]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Target.Choices.${UpdateItemTarget.Self}`,
                        [UpdateItemTarget.Sibling]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Target.Choices.${UpdateItemTarget.Sibling}`,
                        [UpdateItemTarget.Global]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Target.Choices.${UpdateItemTarget.Global}`,
                    },
                    initial: UpdateItemTarget.Self,
                    required: true,
                    blank: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Target.Label`,
                }),
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Item',
                    initial: null,
                    nullable: true,
                    label: 'Item',
                }),
                matchMode: new foundry.data.fields.StringField({
                    nullable: true,
                    initial: MatchMode.Identifier,
                    choices: {
                        [MatchMode.Identifier]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchMode.Choices.${MatchMode.Identifier}`,
                        [MatchMode.Name]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchMode.Choices.${MatchMode.Name}`,
                        [MatchMode.UUID]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchMode.Choices.${MatchMode.UUID}`,
                    },
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchMode.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchMode.Hint`,
                }),
                matchAll: new foundry.data.fields.BooleanField({
                    initial: false,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchAll.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.MatchAll.Hint`,
                }),
                changes: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField(
                        ChangeDataModel.defineSchema(),
                    ),
                    {
                        required: true,
                        initial: [],
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Changes.Label`,
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_UPDATE_ITEM}`,
        },
        executor: async function (
            this: UpdateItemHandlerConfigData,
            event: Event,
        ) {
            if (this.changes.length === 0) return;
            if (this.target === UpdateItemTarget.Sibling && !event.item.actor)
                return;
            if (this.target !== UpdateItemTarget.Self && !this.uuid) return;

            // Get the item(s) to update
            const itemsToUpdate = await getItemsToUpdate(
                event.item,
                this.target,
                this.uuid ?? null,
                this.matchMode ?? MatchMode.Identifier,
                this.matchAll ?? false,
            );

            // Update the items
            await Promise.all(
                itemsToUpdate.map(async (item) => {
                    // Construct change object
                    const changes = this.changes.reduce(
                        (acc, change) => ({
                            ...acc,
                            [change.key]: getChangeValue(change, item),
                        }),
                        {},
                    );

                    // Update the item
                    await item.update(changes);
                }),
            );
        },
    });
}

/* --- Helpers --- */

async function getItemsToUpdate(
    item: CosmereItem,
    target: UpdateItemTarget,
    uuid: string | null,
    matchMode: MatchMode,
    matchAll: boolean,
): Promise<CosmereItem[]> {
    if (target === UpdateItemTarget.Self) return [item];
    else if (target === UpdateItemTarget.Sibling && item.actor && uuid) {
        // Look up the reference item from uuid
        const referenceItem = (await fromUuid(uuid)) as CosmereItem | null;
        if (!referenceItem) return [];

        const siblings = item.actor.items;

        // Determine the match mode
        matchMode =
            matchMode === MatchMode.Identifier && !referenceItem.hasId()
                ? MatchMode.Name
                : matchMode;

        // Get the matcher function
        const matcher =
            matchMode === MatchMode.Identifier
                ? getIdentifierMatcher(referenceItem)
                : matchMode === MatchMode.Name
                  ? getNameMatcher(referenceItem)
                  : getUUIDMatcher(referenceItem);

        // Get the items to update
        return matchAll
            ? siblings.filter(matcher)
            : [siblings.find(matcher)].filter((item) => !!item);
    } else if (target === UpdateItemTarget.Global && uuid) {
        // Look up the target item from uuid
        return [(await fromUuid(uuid)) as CosmereItem | null].filter(
            (item) => !!item,
        );
    } else {
        throw new Error('Invalid target');
    }
}

function getIdentifierMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) =>
        item.hasId() && item.system.id === referenceItem.system.id;
}

function getNameMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.name === referenceItem.name;
}

function getUUIDMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.uuid === referenceItem.uuid;
}
