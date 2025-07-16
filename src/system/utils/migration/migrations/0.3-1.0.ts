import {
    AnyObject,
    AnyMutableObject,
    RawActorData,
    RawDocumentData,
} from '@src/system/types/utils';
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '../../data';
import { CosmereActor, CosmereItem } from '@src/system/documents';
import { handleDocumentMigrationError } from '../utils';
import { ItemConsumeData } from '@src/system/data/item/mixins/activatable';
import { ItemConsumeType } from '@src/system/types/cosmere';

export default {
    from: '0.3',
    to: '1.0',
    execute: async (packID?: string) => {
        // Get relevant compendium, if any
        let compendium:
            | CompendiumCollection<CompendiumCollection.Metadata>
            | undefined;
        if (packID) {
            compendium = game.packs?.get(packID);
        }

        /**
         * Items
         */
        if (!compendium || compendium.documentName === 'Item') {
            const items = await getRawDocumentSources('Item', packID);
            await migrateItems(items, compendium);
        }

        /**
         * Embedded Items
         */
        if (!compendium || compendium.documentName === 'Actor') {
            const actors: RawActorData[] = await getRawDocumentSources(
                'Actor',
                packID,
            );
            await migrateEmbeddedItems(actors, compendium);
        }
    },
};

/**
 * Helpers
 */

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
async function migrateItems(
    items: RawDocumentData<any>[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    for (const item of items) {
        try {
            const changes = {};

            migrateItemData(item, changes);

            // Retrieve document
            const document = await getPossiblyInvalidDocument<CosmereItem>(
                'Item',
                item._id,
                compendium,
            );

            // Apply changes
            document.updateSource(changes, { diff: false });
            await document.update(changes, { diff: false });

            // Ensure invalid documents are properly instantiated
            fixDocumentIfInvalid('Item', document, compendium);
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Item', item);
        }
    }
}

async function migrateEmbeddedItems(
    actors: RawActorData[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    for (const actor of actors) {
        if (actor.items.length === 0) return;

        try {
            const changes: object[] = [];
            for (const item of actor.items) {
                const itemChanges = { _id: item._id };
                migrateItemData(item, itemChanges);

                changes.push(itemChanges);
            }

            // Retrieve document
            const document = await getPossiblyInvalidDocument<CosmereActor>(
                'Actor',
                actor._id,
                compendium,
            );

            // Apply changes
            await document.updateEmbeddedDocuments('Item', changes);
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Actor', actor);
        }
    }
}

function migrateItemData(item: RawDocumentData<any>, changes: object) {
    /**
     * Activation
     */
    if ('activation' in item.system) {
        /* --- Consumption Options --- */
        if ('consume' in item.system.activation) {
            // Consumption options can be fully migrated, not migrated
            // at all, or in a halfway state (array, but not a number range).
            // Use AnyObject here to allow us to catch all three cases.
            const consumptionToMigrate: AnyObject[] = Array.isArray(
                item.system.activation.consume,
            )
                ? (item.system.activation.consume as AnyObject[])
                : [item.system.activation.consume as AnyObject];

            const newConsumption = consumptionToMigrate
                .filter((consume) => !!consume)
                .map((consume) => {
                    const value = {
                        min: 0,
                        max: 0,
                    };

                    if (consume.value) {
                        if (typeof consume.value === 'object') {
                            if ('min' in consume.value)
                                value.min = consume.value.min as number;
                            if ('max' in consume.value)
                                value.max = consume.value.max as number;
                        } else {
                            value.min = consume.value as number;
                            value.max = consume.value as number;
                        }
                    }

                    return {
                        type: consume.type as ItemConsumeType,
                        value,
                        ...(consume.resource
                            ? {
                                  resource: consume.resource,
                              }
                            : {}),
                    } as ItemConsumeData;
                });

            foundry.utils.mergeObject(changes, {
                ['system.activation.consume']: newConsumption,
            });
        }
    }

    if (item.type === 'goal') {
        if ('rewards' in item.system) {
            // Get rewards
            const rewards = item.system.rewards as Record<string, AnyObject>;

            // Set up events
            const events: Record<string, AnyObject> = {};

            // Iterate over rewards
            Object.entries(rewards).forEach(([id, reward]) => {
                if (reward.type === 'items') {
                    events[id] = {
                        id,
                        description: game.i18n!.localize(
                            'COSMERE.Item.EventSystem.Event.Handler.Types.grant-items.Title',
                        ),
                        event: 'goal-complete',
                        handler: {
                            type: 'grant-items',
                            items: reward.items,
                        },
                    };
                } else if (reward.type === 'skill-ranks') {
                    events[id] = {
                        id,
                        description: game.i18n!.localize(
                            'COSMERE.Item.EventSystem.Event.Handler.Types.update-actor.Title',
                        ),
                        event: 'goal-complete',
                        handler: {
                            type: 'update-actor',
                            target: 'parent',
                            changes: [
                                {
                                    key: `system.skills.${reward.skill as string}.rank`,
                                    value: reward.ranks,
                                    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
                                },
                            ],
                            uuid: null,
                        },
                    };
                }
            });

            // Set events
            foundry.utils.mergeObject(changes, {
                ['system.events']: events,
            });
        }
    }

    if (item.type === 'talent') {
        if ('grantRules' in item.system) {
            // Migrate grant rules to event system
            let grantRules = item.system.grantRules as
                | Record<string, AnyObject>
                | AnyObject[];

            if (Array.isArray(grantRules)) {
                grantRules = Object.fromEntries(
                    grantRules.map((rule) => [rule._id, rule]),
                ) as Record<string, AnyObject>;
            }

            // Prepare the events object
            const events: AnyMutableObject = {};

            // Iterate over grant rules and create events
            Object.entries(grantRules).forEach(([id, rule], i) => {
                events[id] = {
                    id,
                    description: game.i18n!.localize(
                        'COSMERE.Item.EventSystem.Event.Handler.Types.grant-items.Title',
                    ),
                    event: 'add-to-actor',
                    handler: {
                        type: 'grant-items',
                        items: rule.items || [],
                    },
                };
            });

            // Merge the events into the changes
            foundry.utils.mergeObject(changes, {
                ['system.events']: events,
            });
        }
    }
}
