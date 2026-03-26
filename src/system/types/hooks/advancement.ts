import {
    AdvancementOverride,
    AdvancementRule,
} from '@src/system/utils/advancement';
import { HOOKS } from '@system/constants/hooks';

/**
 * --- Advancement hooks ---
 * - preOverrideAdvancement
 * - overrideAdvancement
 *
 * --- Registration hooks ---
 * - preRegisterAdvancementOverride
 * - registerAdvancementOverride
 */

export type OverrideAdvancement = (
    rule: AdvancementRule,
    override: AdvancementOverride,
) => void;
export type PreOverrideAdvancement = (
    rule: AdvancementRule,
    override: AdvancementOverride,
) => boolean;

export type RegisterAdvancementOverride = (
    override: AdvancementOverride,
) => void;
export type PreRegisterAdvancementOverride = (
    override: AdvancementOverride,
) => boolean;

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    namespace Hooks {
        interface HookConfig {
            [HOOKS.PRE_OVERRIDE_ADVANCEMENT]: PreOverrideAdvancement;
            [HOOKS.OVERRIDE_ADVANCEMENT]: OverrideAdvancement;
            [HOOKS.PRE_REGISTER_ADVANCEMENT_OVERRIDE]: PreRegisterAdvancementOverride;
            [HOOKS.REGISTER_ADVANCEMENT_OVERRIDE]: RegisterAdvancementOverride;
        }
    }
}
