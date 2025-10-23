import { CosmereActor, InjuryItem } from '@system/documents';
import { InjuryType, RestType } from '@system/types/cosmere';
import { HOOKS } from '@system/constants/hooks';

/**
 * --- Damage application hooks ---
 * - preApplyDamage
 * - applyDamage
 */

type _ApplyDamage<R> = (actor: CosmereActor, damage: DamageValues) => R;
export type PreApplyDamage = _ApplyDamage<boolean>;
export type ApplyDamage = _ApplyDamage<void>;

/**
 * --- Injury application hooks ---
 * - preApplyInjury
 * - applyInjury
 */

export type PreApplyInjury = (
    message: ChatMessage,
    actor: CosmereActor | null,
    data: {
        type: InjuryType;
        duration: number;
    },
) => boolean;

export type ApplyInjury = (
    message: ChatMessage,
    actor: CosmereActor | null,
    injury: InjuryItem,
) => boolean;

/**
 * --- Rest hooks ---
 * - preRest
 * - rest
 */
type _Rest<R> = (actor: CosmereActor, duration: RestType) => R;
export type PreRest = _Rest<boolean>;
export type Rest = _Rest<void>;

/* --- Miscellaneous types --- */

export interface DamageValues {
    calculated: number; // Total damage calculation
    dealt?: number; // Actual damage dealt to actor
}

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    namespace Hooks {
        interface HookConfig {
            [HOOKS.PRE_APPLY_INJURY]: PreApplyInjury;
            [HOOKS.APPLY_INJURY]: ApplyInjury;
            [HOOKS.PRE_APPLY_DAMAGE]: PreApplyDamage;
            [HOOKS.APPLY_DAMAGE]: ApplyDamage;
            [HOOKS.PRE_REST]: PreRest;
            [HOOKS.REST]: Rest;
        }
    }
}