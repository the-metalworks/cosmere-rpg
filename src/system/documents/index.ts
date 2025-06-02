export * from './actor';
export * from './item';
export * from './combat';
export * from './combatant';
export * from './chat-message';
export * from './token';
export * from './active-effect';

import { CosmereActor } from './actor';
import { CosmereItem } from './item';
import { CosmereCombat } from './combat';
import { CosmereCombatant } from './combatant';
import { CosmereChatMessage } from './chat-message';
import { CosmereTokenDocument } from './token';
import { CosmereActiveEffect } from './active-effect';

export type CosmereDocument =
    | CosmereActor
    | CosmereItem
    | CosmereCombat
    | CosmereCombatant
    | CosmereChatMessage
    | CosmereTokenDocument
    | CosmereActiveEffect;
