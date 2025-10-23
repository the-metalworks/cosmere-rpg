import { CombatantDataModel } from './combatant';

export const config = {
    base: CombatantDataModel,
};

export * from './combatant';

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface DataModelConfig {
        Combatant: typeof config;
    }
}