import type {
    EmbedLimit,
    AmountLimitConfig,
    BooleanLimitConfig,
} from './types';

export function isEmbedLimit(config: unknown): config is EmbedLimit {
    return typeof config === 'object' && config !== null;
}

export function isBooleanLimit(
    config: EmbedLimit,
): config is BooleanLimitConfig {
    return 'allowed' in config;
}

export function isAmountLimit(config: EmbedLimit): config is AmountLimitConfig {
    return 'amount' in config;
}
