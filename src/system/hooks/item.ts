import { CosmereItem } from '@system/documents/item';
import { CosmereHooks } from '@system/types/hooks';
import { DeepPartial, DeepMutable } from '@system/types/utils';

// Data
import { GoalItemDataModel } from '@system/data/item/goal';

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
