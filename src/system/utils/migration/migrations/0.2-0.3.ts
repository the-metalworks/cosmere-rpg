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
import { AnyObject } from '@src/system/types/utils';

export default {
    from: '0.2',
    to: '0.3',
    execute: async () => {
        /**
         * Items
         */
        const items = getRawDocumentSources('Item') as CosmereItem[];

        /* --- Talent Trees --- */
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
            await document.update(changes, { diff: false });

            // Ensure invalid documents are properly instantiated
            fixDocumentIfInvalid('Actor', actor._id);
        }),
    );
}

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
                [`system.immunities.-=${isDamage ? 'damage' : 'conditions'}`]:
                    null,
            } as Record<string, boolean | null>,
        ),
    );
}
