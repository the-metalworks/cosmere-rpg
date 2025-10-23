import { ActiveEffectDataModel } from './active-effect';

export const config = {
    base: ActiveEffectDataModel,
};

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface DataModelConfig {
        ActiveEffect: typeof config;
    }
}