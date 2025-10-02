export * from './actor';
export * from './item';
export * from './combat';
export * from './combatant';
export * from './chat-message';
export * from './token';
export * from './active-effect';

import type { CosmereActor } from './actor';
import type { CosmereItem } from './item';
import type { CosmereCombat } from './combat';
import type { CosmereCombatant } from './combatant';
import type { CosmereChatMessage } from './chat-message';
import type { CosmereTokenDocument } from './token';
import type { CosmereActiveEffect } from './active-effect';

export type CosmereDocument =
    | CosmereActor
    | CosmereItem
    | CosmereCombat
    | CosmereCombatant
    | CosmereChatMessage
    | CosmereTokenDocument
    | CosmereActiveEffect;

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface DocumentClassConfig {
        Actor: CosmereActor;
        Item: CosmereItem;
        Combat: CosmereCombat;
        Combatant: CosmereCombatant;
        ChatMessage: CosmereChatMessage;
        Token: CosmereTokenDocument;
        ActiveEffect: CosmereActiveEffect;
    }
}