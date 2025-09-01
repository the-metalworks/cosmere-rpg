import { HOOKS } from '@system/constants/hooks';

export type MessageInteract = (
    message: ChatMessage,
    event: JQuery.Event,
) => boolean;

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    namespace Hooks {
        interface HookConfig {
            [HOOKS.MESSAGE_INTERACTED]: MessageInteract;
        }
    }
}