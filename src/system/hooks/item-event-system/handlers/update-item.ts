import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/events';

import { DataModelField } from '@system/data/fields/data-model-field';
import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

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

// TODO: Localize
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.UpdateItem,
        label: 'Update Item',
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [UpdateItemTarget.Self]: 'Self',
                        [UpdateItemTarget.Sibling]: 'Other on same Actor',
                        [UpdateItemTarget.Global]: 'Global',
                    },
                    initial: UpdateItemTarget.Self,
                    required: true,
                    blank: false,
                    label: 'Target',
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
                        [MatchMode.Identifier]: 'Identifier',
                        [MatchMode.Name]: 'Name',
                        [MatchMode.UUID]: 'UUID',
                    },
                    label: 'Match Mode',
                    hint: 'How to match the item to update.\nIdentifier matches by the identifier set under Details.\nName matches by exact name, case sensitive.\nUUID matches only the exact item.',
                }),
                matchAll: new foundry.data.fields.BooleanField({
                    initial: false,
                    nullable: true,
                    label: 'Match All',
                    hint: 'Whether to match all items or just the first one encountered.',
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

function getChangeValue(change: ChangeData, item: CosmereItem) {
    // Get the current value
    const currentValue = foundry.utils.getProperty(item, change.key) as unknown;
    const valueType = foundry.utils.getType(currentValue);

    switch (change.mode) {
        case CONST.ACTIVE_EFFECT_MODES.ADD:
            return valueType === 'number'
                ? (currentValue as number) + Number(change.value)
                : valueType === 'string'
                  ? (currentValue as string) + String(change.value)
                  : valueType === 'Array'
                    ? (currentValue as unknown[]).concat(change.value)
                    : valueType === 'Object'
                      ? foundry.utils.mergeObject(
                            currentValue as object,
                            JSON.parse(change.value),
                        )
                      : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
            return valueType === 'number'
                ? (currentValue as number) * Number(change.value)
                : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
            return valueType === 'number'
                ? Math.max(currentValue as number, Number(change.value))
                : valueType === 'string'
                  ? (currentValue as string).localeCompare(change.value) > 0
                      ? currentValue
                      : change.value
                  : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
            return valueType === 'number'
                ? Math.min(currentValue as number, Number(change.value))
                : valueType === 'string'
                  ? (currentValue as string).localeCompare(change.value) < 0
                      ? currentValue
                      : change.value
                  : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
        case CONST.ACTIVE_EFFECT_MODES.CUSTOM:
        default:
            return change.value;
    }
}

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
