import {
    ActorType,
    Condition,
    DamageType,
    ItemType,
} from '@system/types/cosmere';
import { CosmereItem, TalentTreeItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';

// Utils
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '@system/utils/data';

// Types
import { Migration } from '@system/types/migration';
import { CosmereActor } from '@src/system/documents';
import { CharacterActorDataModel } from '@src/system/data/actor/character';

// Constants
import { SYSTEM_ID } from '@system/constants';
import COSMERE from '@src/system/config';
import { AnyMutableObject, AnyObject } from '@src/system/types/utils';

interface LegacyTalentTreeDataModel {
    nodes: Collection<LegacyNode>;
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
    execute: async () => {
        /**
         * Items
         */
        const items = await getRawDocumentSources('Item');

        /* --- Talent Trees --- */
        await migrateTalentTrees(items);

        /**
         * Actors
         */
        const actors = await getRawDocumentSources('Actor');
        await migrateActors(actors);
    },
} as Migration;

/**
 * Helpers
 */

/**
 * Helper function to process talent trees
 */
async function migrateTalentTrees(items: AnyObject[]) {
    // Get all talent tree items
    const talentTreeItems = items.filter(
        (i) => i.type === ItemType.TalentTree,
    ) as CosmereItem<LegacyTalentTreeDataModel>[];

    // Migrate talent tree items
    await Promise.all(
        talentTreeItems.map(async (treeItem) => {
            const changes: AnyMutableObject = {};

            // Migrate nodes
            await Promise.all(
                treeItem.system.nodes.map(async (node) => {
                    if (!node.uuid) {
                        console.warn(
                            `[${SYSTEM_ID}] Migration of talent tree "${treeItem._id}" failed. Node "${node.id}" is missing field UUID`,
                        );
                        return;
                    }

                    // Get the item
                    const item = (await fromUuid(node.uuid)) as unknown as
                        | CosmereItem
                        | undefined;
                    if (!item?.isTalent()) {
                        console.warn(
                            `[${SYSTEM_ID}] Migration of talent tree "${treeItem._id}" failed. Could not find talent item "${node.uuid}"`,
                        );
                        return;
                    }

                    changes[`system.nodes.${node.id}`] = {
                        id: node.id,
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
                }),
            );

            // Determine width and height
            const width =
                Math.max(
                    ...treeItem.system.nodes.map(
                        (node) => node.position.column,
                    ),
                ) *
                50 *
                2;
            const height =
                Math.max(
                    ...treeItem.system.nodes.map((node) => node.position.row),
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
            const document = getPossiblyInvalidDocument<CosmereItem>(
                'Item',
                treeItem._id,
            );

            console.log(`[${SYSTEM_ID}] Talent tree changes:`, changes);

            // Apply changes
            document.updateSource(changes, { diff: false });
            await document.update(changes, { diff: false });

            // Ensure invalid documents are properly instantiated
            fixDocumentIfInvalid('Item', document);
        }),
    );
}

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
async function migrateActors(actors: any[]) {
    await Promise.all(
        actors.map(async (actor) => {
            const changes = {};

            /**
             * Common Actor Data
             */

            /* --- Movement --- */
            if ('rate' in actor.system.movement) {
                foundry.utils.mergeObject(changes, {
                    ['system.movement.walk.rate']: actor.system.movement.rate,
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

            if (actor.type === ActorType.Character) {
                /* --- Advancement ---*/
                if (isNaN((actor.system as CharacterActorDataModel).level)) {
                    foundry.utils.mergeObject(changes, {
                        ['system.level']: 1,
                    });
                }
            }

            // Retrieve document
            const document = getPossiblyInvalidDocument<CosmereActor>(
                'Actor',
                actor._id,
            );

            // Apply changes
            document.updateSource(changes, { diff: false });
            await document.update(changes, { diff: false });

            // Ensure invalid documents are properly instantiated
            fixDocumentIfInvalid('Actor', document);
        }),
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

/**
 * Helper function for immunities code reuse. Updates the `changes` object
 * according to the requested immunity type
 */
function migrateImmunities(changes: AnyObject, isDamage: boolean) {
    const config = isDamage ? COSMERE.damageTypes : COSMERE.conditions;

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
