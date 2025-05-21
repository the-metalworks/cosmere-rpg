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
 */

export type UseItem = (item: CosmereItem) => void;
export type PreUseItem = (item: CosmereItem) => boolean;

export type ModeChangeItem = (item: CosmereItem) => void;
export type PreModeChangeItem = (item: CosmereItem) => boolean;
export type ModeActivateItem = ModeChangeItem;
export type PreModeActivateItem = PreModeChangeItem;
export type ModeDeactivateItem = ModeChangeItem;
export type PreModeDeactivateItem = PreModeChangeItem;
