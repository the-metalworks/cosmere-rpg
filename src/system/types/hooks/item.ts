import { CosmereItem } from '@system/documents/item';

/**
 * --- Item activation/usage hooks ---
 * - preUseItem
 * - useItem
 *
 * - preModeActivateItem
 * - modeActivateItem
 * - preModeDeactivateItem
 * - modeDeactivateItem
 *
 * --- Goal hooks ---
 * - progressGoal — Triggered when a goal progresses towards completion (only forward progress).
 * - preProgressGoal
 * - updateProgressGoal — Triggered when a goal's progress is updated (can be forward or backward).
 * - preUpdateProgressGoal
 * - completeGoal — Triggered when a goal is completed.
 * - preCompleteGoal
 */

export type UseItem = (
    item: CosmereItem,
    options: CosmereItem.UseOptions,
) => void;
export type PreUseItem = (
    item: CosmereItem,
    options: CosmereItem.UseOptions,
) => boolean;

export type ModeChangeItem = (item: CosmereItem) => void;
export type PreModeChangeItem = (item: CosmereItem) => boolean;
export type ModeActivateItem = ModeChangeItem;
export type PreModeActivateItem = PreModeChangeItem;
export type ModeDeactivateItem = ModeChangeItem;
export type PreModeDeactivateItem = PreModeChangeItem;

/**
 * Executed when a Goal Item's progresses gets updated towards completion.
 * This only counts forward progress, not executed when the goal's progress is reduced.
 */
export type ProgressGoal = (item: CosmereItem) => void;

/**
 * Executed before a Goal Item's progress is updated towards completion.
 */
export type PreProgressGoal = (
    item: CosmereItem,
    newProgress: number,
) => boolean;

/**
 * Executed when a Goal Item's progress is updated.
 */
export type UpdateProgressGoal = (item: CosmereItem) => void;

/**
 * Executed before a Goal Item's progress is updated.
 */
export type PreUpdateProgressGoal = (
    item: CosmereItem,
    newProgress: number,
) => boolean;

/**
 * Executed when a Goal Item's progress gets filled and the goal is completed.
 */
export type CompleteGoal = (item: CosmereItem) => void;

/**
 * Executed before a Goal Item's progress is filled and the goal is completed.
 */
export type PreCompleteGoal = (item: CosmereItem) => boolean;
