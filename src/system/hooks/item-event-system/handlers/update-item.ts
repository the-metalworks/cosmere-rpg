import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';

import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

// Utils
import { ItemTarget, MatchMode, matchItems } from './utils';
import { getChangeValue, tryApplyRollData } from '@system/utils/changes';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface UpdateItemHandlerConfigData {
    target: ItemTarget;
    uuid?: string | null;
    matchMode?: MatchMode | null;
    matchAll?: boolean | null;
    changes: ChangeData[];
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.UpdateItem,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UpdateItem}.Description`,
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [ItemTarget.Self]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Self}`,
                        [ItemTarget.Sibling]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Sibling}`,
                        [ItemTarget.EquippedWeapon]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.EquippedWeapon}`,
                        [ItemTarget.EquippedArmor]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.EquippedArmor}`,
                        [ItemTarget.Global]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Global}`,
                    },
                    initial: ItemTarget.Self,
                    required: true,
                    blank: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Label`,
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
                        [MatchMode.Identifier]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.Identifier}`,
                        [MatchMode.Name]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.Name}`,
                        [MatchMode.UUID]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.UUID}`,
                    },
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Hint`,
                }),
                matchAll: new foundry.data.fields.BooleanField({
                    initial: false,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.MatchAll.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.General.MatchAll.Hint`,
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
            if (this.target === ItemTarget.Sibling && !event.item.actor) return;
            if (this.target !== ItemTarget.Self && !this.uuid) return;

            // Get the item(s) to update
            const itemsToUpdate = await matchItems(
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
                            [change.key]: getChangeValue(
                                tryApplyRollData(
                                    foundry.utils.mergeObject(
                                        item.getRollData(),
                                        {
                                            event: {
                                                source: {
                                                    item: event.item.getRollData(),
                                                },
                                            },
                                        },
                                    ),
                                    change,
                                ),
                                item,
                            ),
                        }),
                        {},
                    );

                    // Update the item
                    await item.update(changes, event.op);
                }),
            );
        },
    });
}
