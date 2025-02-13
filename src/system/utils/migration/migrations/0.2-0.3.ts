import { ItemType } from '@system/types/cosmere';
import {
    CosmereItem,
    CosmereItemData,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { TalentTree, Talent } from '@system/types/item';

// Utils
import { getRawDocumentSources } from '@system/utils/data';

// Types
import { Migration } from '@system/types/migration';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TalentTreeItemData } from '@src/system/data/item';
import {
    ConfiguredCollectionClassForName,
    InternalGame,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/game.mjs';
import { AnyObject, ConstructorOf } from '@src/system/types/utils';
import { ConfiguredDocumentClass } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes.mjs';
import {
    AnyConstructor,
    AnyConstructorFor,
} from '@league-of-foundry-developers/foundry-vtt-types/src/types/utils.mjs';
import { migrate } from '..';
import { CosmereActor } from '@src/system/documents';

export default {
    from: '0.2',
    to: '0.3',
    execute: async () => {
        console.log(`[${SYSTEM_ID}] Running migration 0.2 -> 0.3`);

        /**
         * Items
         */
        const items = getRawDocumentSources('Item') as CosmereItem[];

        // Talent Trees
        await migrateTalentTrees(items);

        /**
         * Actors
         */
        const actors = getRawDocumentSources('Actor') as CosmereActor[];
        await migrateActors(actors);
    },
} as Migration;

/**
 * Helpers
 */

/**
 * Helper function to process talent trees
 */
async function migrateTalentTrees(items: CosmereItem[]) {
    // Get all talent tree items
    const talentTreeItems = items.filter(
        (i) => i.type === ItemType.TalentTree,
    ) as TalentTreeItem[];

    // Migrate talent tree items
    await Promise.all(
        talentTreeItems.map(async (treeItem) => {
            const changes = {};

            // Migrate nodes
            await Promise.all(
                Object.entries(treeItem.system.nodes).map(
                    async ([id, node]: [string, TalentTree.Node]) => {
                        if (node.type === TalentTree.Node.Type.Talent) {
                            if ('uuid' in node) {
                                // Get item
                                const item = (await fromUuid(
                                    node.uuid,
                                )) as unknown as CosmereItem;

                                if (!!item && item.isTalent()) {
                                    // Add change
                                    foundry.utils.mergeObject(changes, {
                                        [`system.nodes.${id}.item`]:
                                            item.toObject(),
                                    });

                                    // Get all talent prerequisite
                                    const talentPrereqRules = Object.entries(
                                        node.prerequisites,
                                    )
                                        .map(
                                            ([id, prereq]: [
                                                string,
                                                TalentTree.Node.Prerequisite,
                                            ]) => ({ ...prereq, id }),
                                        )
                                        .filter(
                                            (prereq) =>
                                                prereq.type ===
                                                TalentTree.Node.Prerequisite
                                                    .Type.Talent,
                                        );
                                    // .filter(prereq => prereq.mode === TalentTree.Node.Prerequisite.Mode.AnyOf || prereq.talents.size === 1);

                                    // Get required talents
                                    const requiredTalentUUIDs =
                                        talentPrereqRules
                                            .map((prereq) => [
                                                ...prereq.talents.values(),
                                            ])
                                            .flat()
                                            .map((ref) => ref.uuid);

                                    // Find connection node ids for required talents
                                    const connectionNodeIds = Object.entries(
                                        treeItem.system.nodes,
                                    )
                                        .filter(
                                            ([id, node]: [
                                                string,
                                                TalentTree.Node,
                                            ]) =>
                                                node.type ===
                                                TalentTree.Node.Type.Talent,
                                        )
                                        .filter(
                                            ([id, node]: [
                                                string,
                                                TalentTree.TalentNode,
                                            ]) =>
                                                requiredTalentUUIDs.includes(
                                                    node.uuid,
                                                ),
                                        )
                                        .map(
                                            ([id, node]: [
                                                string,
                                                TalentTree.Node,
                                            ]) => id,
                                        );

                                    // Set connections
                                    foundry.utils.mergeObject(changes, {
                                        [`system.nodes.${id}.connections`]:
                                            connectionNodeIds.reduce(
                                                (acc, id) => ({
                                                    ...acc,
                                                    [id]: {
                                                        id,
                                                    },
                                                }),
                                                {},
                                            ),
                                    });
                                } else {
                                    // Remove node
                                    foundry.utils.mergeObject(changes, {
                                        [`system.nodes.-=${id}`]: null,
                                    });
                                }
                            }
                        }
                    },
                ),
            );

            // Retrieve document
            const document = (game.items as Collection<CosmereItem>).get(
                treeItem._id,
                { strict: true },
            );

            console.log(`[${SYSTEM_ID}] Talent tree changes:`, changes);

            // Apply changes
            await document.update(changes);
        }),
    );
}

async function migrateActors(actors: CosmereActor[]) {
    await Promise.all(
        actors.map(async (actor) => {
            const changes = {};

            /**
             * Movement Speed
             */
            if ('rate' in actor.system.movement) {
                foundry.utils.mergeObject(changes, {
                    ['system.movement.walk.rate']: actor.system.movement.rate,
                    ['system.movement.fly.rate']: 0,
                    ['system.movement.swim.rate']: 0,
                    ['system.movement.-=rate']: null,
                });
            }

            // Retrieve document
            const document = (game.actors as Collection<CosmereActor>).get(
                actor._id,
                { strict: true },
            );

            console.log(`[${SYSTEM_ID}] Actor changes:`, changes);

            // Apply changes
            await document.update(changes);
        }),
    );
}
