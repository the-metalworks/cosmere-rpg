import {
    ItemType,
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    Resource,
    DamageType,
    Skill,
    Attribute,
    ItemResource,
} from '@system/types/cosmere';
import type {
    RawDocumentData,
    RawActorData,
    AnyMutableObject,
} from '@src/system/types/utils';

// Data
import { ActionItemDataModel } from '@system/data/item/action';

// Utils
import {
    fixInvalidDocument,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '@system/utils/data';
import { handleDocumentMigrationError } from '../utils';

// Logging
import { Logger } from '@system/utils/logger';

// Constants
const ACTIVATABLE_ITEM_TYPES = [
    'armor',
    'equipment',
    'power',
    'talent',
    'trait',
    'weapon',
];

interface ActivationData {
    id?: string;
    type?: string;
    description?: object;
    activation?: {
        type: string;
        cost: {
            value?: number | null;
            type?: string | null;
        };
        consume?: {
            type: string;
            value?: {
                min: number;
                max: number;
                actual?: number;
            };
            resource?: string;
        }[];
        flavor?: string;
        skill?: string | null;
        attribute?: string | null;
        modifierFormula?: string | null;
        plotDie?: boolean | null;
        opportunity?: number | null;
        complication?: number | null;
        uses?: {
            type: string;
            value: number;
            max: number;
            recharge?: string | null;
        } | null;
    };
    damage?: {
        formula?: string;
        grazeOverrideFormula?: string;
        type?: string;
        skill?: string;
        attribute?: string;
    };
}

interface EventsItemData {
    events: Record<string, EventRuleData>;
}

interface EventRuleData<THandler extends EventHandler = UnknownHandler> {
    id: string;
    event: string;
    handler: THandler;
}

type EventHandler = UnknownHandler | UserItemEventHandler;

interface UnknownHandler {
    type: string;
}

interface UserItemEventHandler {
    type: 'use-item';
    target: string;
    uuid?: string;
    matchMode?: 'identifier' | 'name' | 'uuid' | 'document-type';
    matchAll?: boolean;
}

let logger: Logger;

export default {
    from: '2.1',
    to: '3.0',
    execute: async (packId?: string) => {
        logger ??= new Logger('migration');

        const compendium = packId ? game.packs?.get(packId) : undefined;

        if (!compendium || compendium.documentName === 'Item') {
            const items = await getRawDocumentSources('Item', packId);
            await migrateGlobalItems(items, compendium);
        }

        if (!compendium || compendium.documentName === 'Actor') {
            const actors = await getRawDocumentSources<RawActorData>(
                'Actor',
                packId,
            );
            await migrateGlobalActors(actors, compendium);
        }
    },
};

async function migrateGlobalItems(
    items: RawDocumentData[],
    compendium?: CompendiumCollection.Any,
) {
    for (const item of items) {
        const document = await getPossiblyInvalidDocument<Item.Implementation>(
            'Item',
            item._id,
            compendium,
        );

        if (item.type === 'action') await migrateAction(item, document);
        else if (isActivatableItemData(item)) {
            await migrateActivatableItem(item, document);
        }

        if (isEventsItemData(item)) {
            await migrateEventsItem(item, document);
        }
    }
}

async function migrateGlobalActors(
    actors: RawActorData[],
    compendium?: CompendiumCollection.Any,
) {
    for (const data of actors) {
        logger.debug('Migrating actor', { raw: data });
        try {
            if (data.items.length === 0) continue;

            const actor =
                await getPossiblyInvalidDocument<Actor.Implementation>(
                    'Actor',
                    data._id,
                    compendium,
                );

            for (const itemData of data.items) {
                const item = actor.items.get(itemData._id, {
                    invalid: true,
                    strict: true,
                }) as Item.Implementation;

                if (itemData.type === 'action') {
                    await migrateAction(itemData, item);
                } else if (isActivatableItemData(itemData)) {
                    await migrateActivatableItem(itemData, item);
                }

                if (isEventsItemData(itemData)) {
                    await migrateEventsItem(itemData, item);
                }
            }
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Actor', data);
        }
    }
}

async function migrateActivatableItem(
    data: RawDocumentData<ActivationData>,
    document: Item.Implementation,
) {
    try {
        logger.debug('Migrating item', { raw: data });

        if (data.system.activation) {
            if (data.system.activation.uses) {
                await document.update({
                    system: {
                        resources: {
                            [data.system.activation.uses.type === 'use'
                                ? ItemResource.Uses
                                : ItemResource.Charges]: {
                                value: data.system.activation.uses.value,
                                max: data.system.activation.uses.max,
                                recharge: data.system.activation.uses.recharge,
                            },
                        },
                    },
                });
            }
        }

        if (data.type === 'weapon') {
            await document.update({
                system: {
                    strike: {
                        die: damageFormulaToDieSizeAndCount(
                            data.system.damage?.formula,
                        ),
                        damageType: data.system.damage?.type ?? DamageType.Keen,
                        skill: data.system.damage?.skill ?? Skill.LightWeapons,
                    },
                },
            });
        } else {
            if (document.actions.length > 0) return;

            const actionData = migrateActionData(data, true);
            if (!actionData) return;

            await Item.create(
                {
                    name: data.name,
                    img: data.img,
                    type: ItemType.Action,
                    system: actionData.toObject(),
                },
                {
                    //@ts-expect-error foundry-vtt-types does not properly resolve Item.Parent override here
                    parent: document,
                },
            );
        }
    } catch (err: unknown) {
        handleDocumentMigrationError(err, 'Item', data);
    }
}

async function migrateEventsItem(
    data: RawDocumentData<EventsItemData>,
    document: Item.Implementation,
) {
    try {
        logger.debug('Migrating events for item', { raw: data });

        const eventsChanges: Record<string, AnyMutableObject> = {};
        Object.values(data.system.events).forEach((rule) => {
            // 'use' event is only available on actions in 3.0
            if (rule.event === 'use' && data.type !== 'action') {
                eventsChanges[rule.id] ??= {};
                eventsChanges[rule.id].event = 'use-action';
            }

            if (hasUseItemHandler(rule)) {
                eventsChanges[rule.id] ??= {};
                switch (rule.handler.target) {
                    case 'sibling':
                    case 'global':
                        eventsChanges[rule.id].handler = {
                            matchDocument: {
                                steps: [
                                    {
                                        target: rule.handler.target,
                                        reference: rule.handler.uuid,
                                        matchBy: rule.handler.matchMode,
                                        documentType: 'Item',
                                        matchMode: rule.handler.matchAll
                                            ? 'all'
                                            : 'first',
                                    },
                                ],
                            },
                        };
                        break;

                    case 'equipped-weapon':
                    case 'equipped-armor':
                        eventsChanges[rule.id].handler = {
                            matchDocument: {
                                steps: [
                                    {
                                        target: rule.handler.target,
                                        reference: rule.handler.uuid,
                                        matchBy: 'document-type',
                                        documentType: 'Item',
                                        matchMode: rule.handler.matchAll
                                            ? 'all'
                                            : 'first',
                                    },
                                ],
                            },
                        };
                        break;
                }
            }
        });

        await document.update({
            system: {
                events: eventsChanges,
            },
        });
    } catch (err: unknown) {
        handleDocumentMigrationError(err, 'Item', data);
    }
}

async function migrateAction(
    data: RawDocumentData<ActivationData>,
    document: Item.Implementation,
) {
    try {
        await document.update({
            system: migrateActionData(data, false),
        });
    } catch (err: unknown) {
        handleDocumentMigrationError(err, 'Item', data);
    }
}

function migrateActionData(
    data: RawDocumentData<ActivationData>,
    embedded: boolean,
): ActionItemDataModel | null {
    const activation = data.system.activation;
    if (!activation) return null;
    if (activation.type == ActivationType.None) return null;

    const id =
        data.system.id ??
        data.name
            .toLowerCase()
            .replace(/[^a-z0-9-_\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .join('-');

    return new ActionItemDataModel(
        {
            id: id,
            description: data.system.description,
            activation: {
                type: activation.type as ActivationType,
                cost: {
                    value: activation.cost.value,
                    type: activation.cost.type as ActionCostType,
                },
                flavor: activation.flavor,
                consumption: [
                    ...(activation.consume?.map((c) => ({
                        type: c.type as ItemConsumeType,
                        resource: c.resource as Resource,
                        value: c.value,
                        matchDocument:
                            c.type === 'resource'
                                ? {
                                      steps: [
                                          {
                                              target: 'ancestor',
                                              matchBy: 'document-type',
                                              documentType: 'Actor',
                                              matchMode: 'first',
                                          },
                                      ],
                                  }
                                : undefined,
                    })) ?? []),

                    ...(activation.uses
                        ? [
                              {
                                  type: ItemConsumeType.ItemResource,
                                  resource:
                                      activation.uses.type === 'use'
                                          ? ItemResource.Uses
                                          : ItemResource.Charges,
                                  value: {
                                      min: 1,
                                      max: 1,
                                      actual: 1,
                                  },
                                  matchDocument: {
                                      steps: [
                                          {
                                              target: embedded
                                                  ? ('parent' as const)
                                                  : ('self' as const),
                                          },
                                      ],
                                  },
                              },
                          ]
                        : []),
                ],
            },

            ...(activation.type === 'skill_test'
                ? {
                      skillTest: {
                          skill: activation.skill as Skill,
                          attribute: activation.attribute as Attribute,
                          modifierFormula: activation.modifierFormula,
                          plotDie: activation.plotDie ?? null,
                          opportunity: activation.opportunity,
                          complication: activation.complication,
                      },
                  }
                : {}),

            ...(data.system.damage
                ? {
                      damage: {
                          type: data.system.damage.type as DamageType,
                          skill: data.system.damage.skill as Skill,
                          attribute: data.system.damage.attribute as Attribute,
                          formula: data.system.damage.formula,
                          grazeOverrideFormula:
                              data.system.damage.grazeOverrideFormula,
                      },
                  }
                : {}),

            ...(activation.uses && !embedded
                ? {
                      resources: {
                          [activation.uses.type === 'use'
                              ? ItemResource.Uses
                              : ItemResource.Charges]: {
                              value: activation.uses.value,
                              max: activation.uses.max,
                              recharge: activation.uses.recharge,
                          },
                      },
                  }
                : {}),
        },
        {
            fallback: true,
        },
    );
}

/* --- Helpers --- */

function isActivatableItemData(
    data: RawDocumentData<object>,
): data is RawDocumentData<ActivationData> {
    return ACTIVATABLE_ITEM_TYPES.includes(data.type);
}

function isEventsItemData(
    data: RawDocumentData<object>,
): data is RawDocumentData<EventsItemData> {
    return 'events' in data.system;
}

function hasUseItemHandler(
    data: EventRuleData,
): data is EventRuleData<UserItemEventHandler> {
    return data.handler.type === 'use-item';
}

function damageFormulaToDieSizeAndCount(
    formula?: string,
): { size: string; count: number } | null {
    if (!formula) return null;

    const regex = new RegExp(/(\d+)(d\d+)/gi);
    const match = regex.exec(formula);
    if (!match) return null;

    return {
        size: match[2],
        count: Number(match[1]),
    };
}
