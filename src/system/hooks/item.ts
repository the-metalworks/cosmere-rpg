import { CosmereItem, RelationshipsItem } from '@system/documents/item';
import { CosmereHooks } from '@system/types/hooks';
import { DeepPartial, DeepMutable } from '@system/types/utils';
import { ItemOrigin } from '@system/types/item';

// Data
import { GoalItemDataModel } from '@system/data/item/goal';
import { ItemRelationship } from '@system/data/item/mixins/relationships';

// Utils
import ItemRelationshipUtils from '@system/utils/item/relationship';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';

Hooks.on(
    'preUpdateItem',
    (item: CosmereItem, update: DeepMutable<DeepPartial<CosmereItem>>) => {
        if (item.isGoal()) {
            if (foundry.utils.hasProperty(update, 'system.level')) {
                const currentLevel = item.system.level;
                const newLevel = foundry.utils.getProperty(
                    update,
                    'system.level',
                ) as number;

                if (newLevel !== currentLevel) {
                    /**
                     * Hook: preUpdateProgressGoal
                     */
                    if (
                        Hooks.call<CosmereHooks.PreUpdateProgressGoal>(
                            HOOKS.PRE_UPDATE_PROGRESS_GOAL,
                            item,
                            newLevel,
                        ) === false
                    ) {
                        return false;
                    }

                    if (newLevel > currentLevel) {
                        /**
                         * Hook: preProgressGoal
                         */
                        if (
                            Hooks.call<CosmereHooks.PreProgressGoal>(
                                HOOKS.PRE_PROGRESS_GOAL,
                                item,
                                newLevel,
                            ) === false
                        ) {
                            return false;
                        }
                    }

                    if (
                        newLevel ===
                        (
                            GoalItemDataModel.schema.fields
                                .level as foundry.data.fields.NumberField
                        ).options.max!
                    ) {
                        /**
                         * Hook: preCompleteGoal
                         */
                        if (
                            Hooks.call<CosmereHooks.PreCompleteGoal>(
                                HOOKS.PRE_COMPLETE_GOAL,
                                item,
                            ) === false
                        ) {
                            return false;
                        }
                    }

                    // Add the previous level to the update
                    foundry.utils.mergeObject(
                        update,
                        {
                            [`flags.${SYSTEM_ID}.previousLevel`]: currentLevel,
                        },
                        {
                            inplace: true,
                        },
                    );
                }
            }
        }
    },
);

Hooks.on(
    'updateItem',
    (item: CosmereItem, update: DeepPartial<CosmereItem>) => {
        if (item.isGoal()) {
            const previousLevel =
                item.getFlag<number>(SYSTEM_ID, 'previousLevel') ?? 0;
            const newLevel = item.system.level;

            if (newLevel !== previousLevel) {
                /**
                 * Hook: updateProgressGoal
                 */
                Hooks.callAll<CosmereHooks.UpdateProgressGoal>(
                    HOOKS.UPDATE_PROGRESS_GOAL,
                    item,
                );

                if (newLevel > previousLevel) {
                    /**
                     * Hook: progressGoal
                     */
                    Hooks.callAll<CosmereHooks.ProgressGoal>(
                        HOOKS.PROGRESS_GOAL,
                        item,
                    );
                }

                if (
                    newLevel ===
                    (
                        GoalItemDataModel.schema.fields
                            .level as foundry.data.fields.NumberField
                    ).options.max!
                ) {
                    /**
                     * Hook: completeGoal
                     */
                    Hooks.callAll<CosmereHooks.CompleteGoal>(
                        HOOKS.COMPLETE_GOAL,
                        item,
                    );
                }
            }
        }
    },
);

/* --- Relationships --- */

Hooks.on('preCreateItem', (item: CosmereItem) => {
    if (!item.hasRelationships()) return;
    if (item.hasRelationshipOfType(ItemRelationship.Type.Parent)) return;
    if (!item.actor) return;

    // Get origin flag
    const origin = item.getFlag<ItemOrigin>(SYSTEM_ID, 'meta.origin');
    if (!origin) return;

    // Attempt to find a suitable parent item on the actor
    const parentItem = item.actor.items.find(
        (otherItem) =>
            otherItem.hasRelationships() &&
            otherItem.hasId() &&
            otherItem.id === origin.id &&
            otherItem.type === origin.type,
    );
    if (!parentItem) return;

    // Add a parent relationship to the item
    item.addRelationship(
        parentItem,
        ItemRelationship.Type.Parent,
        ItemRelationship.RemovalPolicy.Keep,
        true,
    );
});

Hooks.on(
    'createItem',
    async (item: CosmereItem, _: unknown, userId: string) => {
        if (game.user!.id !== userId) return;
        if (!item.hasRelationships()) return;

        await Promise.all(
            item.system.relationships.map((relationship) =>
                connectRelationship(item, relationship),
            ),
        );

        if (item.hasRelationshipOfType(ItemRelationship.Type.Parent)) {
            // If the item has a parent relationship, we need to update the parent item
            const parentRelationship = item.system.relationships.find(
                (relationship) =>
                    relationship.type === ItemRelationship.Type.Parent,
            )!;

            // Get the parent item
            const parentItem = (await fromUuid(
                parentRelationship.uuid,
            )) as CosmereItem | null;

            if (
                parentItem &&
                parentItem.hasRelationships() &&
                parentItem.hasId()
            ) {
                // Set the origin flag on the item
                await item.setFlag(SYSTEM_ID, 'meta.origin', {
                    id: parentItem.system.id,
                    type: parentItem.type,
                });
            }
        }

        if (item.actor && item.hasId()) {
            // Get all orphaned items
            const orphanedItems = item.actor.items.filter(
                (otherItem) =>
                    otherItem.hasRelationships() &&
                    !otherItem.hasRelationshipOfType(
                        ItemRelationship.Type.Parent,
                    ),
            );

            // For each orphaned item, check if it has an origin flag pointing to this item
            await Promise.all(
                orphanedItems.map(async (orphanedItem) => {
                    const origin = orphanedItem.getFlag<ItemOrigin>(
                        SYSTEM_ID,
                        'meta.origin',
                    );
                    if (!origin) return;

                    // If the origin matches this item, add a parent relationship
                    if (
                        origin.id === item.system.id &&
                        origin.type === item.type
                    ) {
                        await orphanedItem.addRelationship(
                            item,
                            ItemRelationship.Type.Parent,
                        );
                    }
                }),
            );
        }
    },
);

Hooks.on(
    'updateItem',
    async (
        item: CosmereItem,
        update: DeepPartial<CosmereItem>,
        _: unknown,
        userId: string,
    ) => {
        if (game.user!.id !== userId) return;
        if (!item.hasRelationships()) return;
        if (!foundry.utils.hasProperty(update, 'system.relationships')) return;

        const updatedRelationships = (update as DeepPartial<RelationshipsItem>)
            .system!.relationships as Record<string, ItemRelationship>;

        await Promise.all(
            Object.values(updatedRelationships).map(
                (relationship: ItemRelationship) =>
                    connectRelationship(item, relationship),
            ),
        );
    },
);

Hooks.on(
    'deleteItem',
    async (item: CosmereItem, _: unknown, userId: string) => {
        if (game.user!.id !== userId) return;
        if (!item.hasRelationships()) return;

        await Promise.all(
            item.system.relationships.map(async (relationship) => {
                if (relationship.type === ItemRelationship.Type.Child) {
                    // Get the related item
                    const relatedItem = (await fromUuid(
                        relationship.uuid,
                    )) as CosmereItem | null;
                    if (!relatedItem?.hasRelationships()) return;

                    if (
                        relationship.removalPolicy ===
                        ItemRelationship.RemovalPolicy.Remove
                    ) {
                        // Delete the related item
                        await relatedItem.delete();
                    } else {
                        // Remove the relationship from the related item
                        await disconnectRelationship(relatedItem, relationship);
                    }
                } else {
                    // If the relationship is a parent, we need to disconnect it from the related item
                    await disconnectRelationship(item, relationship);
                }
            }),
        );
    },
);

/* --- helpers --- */

async function connectRelationship(
    item: RelationshipsItem,
    relationShip: ItemRelationship,
): Promise<void> {
    // Get the related item
    const relatedItem = (await fromUuid(
        relationShip.uuid,
    )) as CosmereItem | null;
    if (!relatedItem?.hasRelationships()) return;

    const contraType =
        relationShip.type === ItemRelationship.Type.Parent
            ? ItemRelationship.Type.Child
            : ItemRelationship.Type.Parent;

    // If the related item is already related to the item, skip
    if (relatedItem.isRelatedTo(item, contraType)) return;

    // Add the relationship to the related item
    await ItemRelationshipUtils.setRelationship(
        relationShip.id,
        relatedItem,
        item,
        contraType,
        relationShip.removalPolicy,
    );
}

async function disconnectRelationship(
    item: RelationshipsItem,
    relationShip: ItemRelationship,
): Promise<void> {
    // Get the related item
    const relatedItem = (await fromUuid(
        relationShip.uuid,
    )) as CosmereItem | null;
    if (!relatedItem?.hasRelationships()) return;

    // Remove the relationship from the related item
    await relatedItem.update({
        [`system.relationships.-=${relationShip.id}`]: {
            type: relationShip.type,
        },
    });
}
