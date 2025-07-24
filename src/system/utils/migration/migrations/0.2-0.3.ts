import { ActorType, ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';

// Utils
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '@system/utils/data';
import { handleDocumentMigrationError } from '../utils';

// Types
import { Migration } from '@system/types/migration';
import { CosmereActor } from '@src/system/documents';
import { CharacterActorDataModel } from '@src/system/data/actor/character';

// Constants
import COSMERE from '@src/system/config';
import {
    AnyMutableObject,
    RawDocumentData,
    AnyObject,
} from '@src/system/types/utils';

interface LegacyTalentTreeDataModel {
    nodes: Record<string, LegacyNode>;
}

interface LegacyNode {
    id: string;
    type: 'icon' | 'text';
    uuid: string;
    position: {
        row: number;
        column: number;
    };
}

export default {
    from: '0.2',
    to: '0.3',
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

            /* --- Talent Trees --- */
            await migrateTalentTrees(items, compendium);
        }

        /**
         * Actors
         */
        if (!compendium || compendium.documentName === 'Actor') {
            const actors = await getRawDocumentSources('Actor', packID);
            await migrateActors(actors, compendium);
        }
    },
} as Migration;

/**
 * Helpers
 */

/**
 * Helper function to process talent trees
 */
async function migrateTalentTrees(
    items: RawDocumentData[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    // Get all talent tree items
    const talentTreeItems = items.filter(
        (i) => i.type === (ItemType.TalentTree as string),
    ) as unknown as RawDocumentData<LegacyTalentTreeDataModel>[];

    // Migrate talent tree items
    await Promise.all(
        talentTreeItems.map(async (treeItem) => {
            try {
                const changes: AnyMutableObject = {};

                // Migrate nodes
                await Promise.all(
                    Object.entries(treeItem.system.nodes).map(
                        async ([id, node]) => {
                            if (!node.uuid)
                                throw new Error(
                                    `Node "${node.id}" is missing required field UUID`,
                                );

                            // Get the item
                            const item = (await fromUuid(
                                node.uuid,
                            )) as unknown as CosmereItem | undefined;
                            if (!item?.isTalent())
                                throw new Error(
                                    `Could not find talent item "${node.uuid}" referenced by node "${node.id}"`,
                                );

                            changes[`system.nodes.${id}`] = {
                                id: id,
                                type: TalentTree.Node.Type.Talent,
                                position: {
                                    x: node.position.column * 50 * 2,
                                    y: node.position.row * 50 * 2,
                                },
                                talentId: item.system.id,
                                uuid: node.uuid,
                                size: {
                                    width: 50,
                                    height: 50,
                                },
                                prerequisites: {},
                                connections: {},
                            };
                        },
                    ),
                );

                // Determine width and height
                const width =
                    Math.max(
                        ...Object.entries(treeItem.system.nodes).map(
                            ([id, node]) => node.position.column,
                        ),
                    ) *
                    50 *
                    2;
                const height =
                    Math.max(
                        ...Object.entries(treeItem.system.nodes).map(
                            ([id, node]) => node.position.row,
                        ),
                    ) *
                    50 *
                    2;

                // Set view bounds
                changes['system.viewBounds'] = {
                    x: 0,
                    y: 0,
                    width: width + 50,
                    height: height + 50,
                };

                // Set display size
                changes['system.display'] = {
                    width: width + 50,
                    height: height + 50,
                };

                // Retrieve document
                const document = await getPossiblyInvalidDocument<CosmereItem>(
                    'Item',
                    treeItem._id,
                    compendium,
                );

                // Apply changes
                document.updateSource(changes, { diff: false });
                await document.update(changes, { diff: false });

                // Ensure invalid documents are properly instantiated
                fixDocumentIfInvalid('Item', document, compendium);
            } catch (err: unknown) {
                handleDocumentMigrationError(err, 'Item', treeItem);
            }
        }),
    );
}

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
async function migrateActors(
    actors: RawDocumentData<any>[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    await Promise.all(
        actors.map(async (actor) => {
            try {
                const changes = {};

                /**
                 * Common Actor Data
                 */

                /* --- Movement --- */
                if ('rate' in actor.system.movement) {
                    foundry.utils.mergeObject(changes, {
                        ['system.movement.walk.rate']:
                            actor.system.movement.rate,
                        ['system.movement.fly.rate']: 0,
                        ['system.movement.swim.rate']: 0,
                        ['system.movement.-=rate']: null,
                    });
                }

                /* --- Damage Immunities --- */
                migrateImmunities(changes, true);

                /* --- Condition Immunities --- */
                migrateImmunities(changes, false);

                /**
                 * Character Data
                 */

                if (actor.type === (ActorType.Character as string)) {
                    /* --- Advancement ---*/
                    if (
                        !(actor.system as CharacterActorDataModel).level ||
                        isNaN((actor.system as CharacterActorDataModel).level)
                    ) {
                        foundry.utils.mergeObject(changes, {
                            ['system.level']: 1,
                        });
                    }
                }

                // Retrieve document
                const document = await getPossiblyInvalidDocument<CosmereActor>(
                    'Actor',
                    actor._id,
                    compendium,
                );

                // Apply changes
                document.updateSource(changes, { diff: false });
                await document.update(changes, { diff: false });

                // Ensure invalid documents are properly instantiated
                fixDocumentIfInvalid('Actor', document, compendium);
            } catch (err: unknown) {
                handleDocumentMigrationError(err, 'Actor', actor);
            }
        }),
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

/**
 * Helper function for immunities code reuse. Updates the `changes` object
 * according to the requested immunity type
 */
function migrateImmunities(changes: AnyObject, isDamage: boolean) {
    const config = isDamage ? COSMERE.damageTypes : COSMERE.statuses;

    foundry.utils.mergeObject(
        changes,
        Object.keys(config).reduce(
            (acc, key) => ({
                ...acc,
                [`system.immunities.${isDamage ? 'damage' : 'condition'}.${key}`]:
                    false,
            }),
            {
                // Note: the key for conditions is mismatched because it was
                // renamed in this version. Damage was unchanged in name.
                [`system.immunities.-=${isDamage ? 'damage' : 'conditions'}`]:
                    null,
            } as Record<string, boolean | null>,
        ),
    );
}
