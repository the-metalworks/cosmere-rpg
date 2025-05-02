import { CosmereItem } from '@system/documents/item';
import { SYSTEM_ID } from '@system/constants';

/**
 * --- Item activation/usage hooks ---
 * - preUseItem
 * - useItem
 *
 * - preModeActivateItem
 * - modeActivateItem
 * - preModeDeactivateItem
 * - modeDeactivateItem
 */

export type UseItem = (item: CosmereItem) => void;
export const UseItem = `${SYSTEM_ID}.useItem` as const;
export type PreUseItem = (item: CosmereItem) => boolean;
export const PreUseItem = `${SYSTEM_ID}.preUseItem` as const;

export type ModeChangeItem = (item: CosmereItem) => void;
export type PreModeChangeItem = (item: CosmereItem) => boolean;
export type ModeActivateItem = ModeChangeItem;
export const ModeActivateItem = `${SYSTEM_ID}.modeActivateItem` as const;
export type PreModeActivateItem = PreModeChangeItem;
export const PreModeActivateItem = `${SYSTEM_ID}.preModeActivateItem` as const;
export type ModeDeactivateItem = ModeChangeItem;
export const ModeDeactivateItem = `${SYSTEM_ID}.modeDeactivateItem` as const;
export type PreModeDeactivateItem = PreModeChangeItem;
export const PreModeDeactivateItem =
    `${SYSTEM_ID}.preModeDeactivateItem` as const;
