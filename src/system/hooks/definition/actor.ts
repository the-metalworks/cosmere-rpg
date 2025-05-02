import { CosmereActor, InjuryItem } from '@system/documents';
import { InjuryType, RestType } from '@system/types/cosmere';

import { SYSTEM_ID } from '@system/constants';

/**
 * --- Damage application hooks ---
 * - preApplyDamage
 * - postApplyDamage
 */

export type ApplyDamage<R> = (actor: CosmereActor, damage: DamageValues) => R;
export type PreApplyDamage = ApplyDamage<boolean>;
export const PreApplyDamage = `${SYSTEM_ID}.preApplyDamage` as const;
export type PostApplyDamage = ApplyDamage<void>;
export const PostApplyDamage = `${SYSTEM_ID}.postApplyDamage` as const;

/**
 * --- Injury application hooks ---
 * - preApplyInjury
 * - postApplyInjury
 */

export type PreApplyInjury = (
    message: ChatMessage,
    actor: CosmereActor | null,
    data: {
        type: InjuryType;
        duration: number;
    },
) => boolean;
export const PreApplyInjury = `${SYSTEM_ID}.preApplyInjury` as const;

export type PostApplyInjury = (
    message: ChatMessage,
    actor: CosmereActor | null,
    injury: InjuryItem,
) => boolean;
export const PostApplyInjury = `${SYSTEM_ID}.postApplyInjury` as const;

/**
 * --- Rest hooks ---
 * - preRest
 * - postRest
 */
export type Rest = (actor: CosmereActor, duration: RestType) => boolean;
export type PreRest = Rest;
export const PreRest = `${SYSTEM_ID}.preRest` as const;
export type PostRest = Rest;
export const PostRest = `${SYSTEM_ID}.postRest` as const;

/* --- Miscellaneous types --- */

export interface DamageValues {
    calculated: number; // Total damage calculation
    dealt?: number; // Actual damage dealt to actor
}
