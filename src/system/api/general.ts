import {
    CurrencyConfig,
    SkillConfig,
    PowerTypeConfig,
    ActionTypeConfig,
} from '@system/types/config';

interface CurrencyConfigData extends CurrencyConfig {
    /**
     * Unique id for the currency.
     */
    id: string;
}

export function registerCurrency(data: CurrencyConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.currencies && !force)
        throw new Error('Cannot override existing currency config.');

    if (force) {
        console.warn('Registering currency with force=true.');
    }

    // Ensure a base denomination is configured
    if (!data.denominations.primary.some((d) => d.base))
        throw new Error(`Currency ${data.id} must have a base denomination.`);
    if (
        data.denominations.secondary &&
        !data.denominations.secondary.some((d) => d.base)
    )
        throw new Error(
            `Secondary denominations for currency ${data.id} must have a base denomination.`,
        );

    // Get base denomination
    const baseDenomination = data.denominations.primary.find((d) => d.base)!;

    // Ensure base denomination has a unit
    if (!baseDenomination.unit)
        throw new Error(
            `Base denomination ${baseDenomination.id} for currency ${data.id} must have a unit.`,
        );

    // Add to currency config
    CONFIG.COSMERE.currencies[data.id] = {
        label: data.label,
        icon: data.icon,
        denominations: data.denominations,
    };
}
