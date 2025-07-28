import { CurrencyConfig } from '@system/types/config';
import { CommonRegistrationData } from './types';
import { RegistrationHelper } from './helper';

export function getCurrentRegistrations() {
    return RegistrationHelper.COMPLETED;
}

interface CurrencyConfigData extends CurrencyConfig, CommonRegistrationData {
    /**
     * Unique id for the currency.
     */
    id: string;
}

export function registerCurrency(data: CurrencyConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        denominations: data.denominations,
        label: data.label,
        icon: data.icon,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const key = `currencies.${data.id}`;

    const register = () => {
        // Ensure a base denomination is configured
        if (!data.denominations.primary.some((d) => d.base)) {
            RegistrationHelper.logger.error(
                data.source,
                `Failed to register config: ${key}. Reason: Currency must have a base denomination.`,
            );
            return false;
        }

        if (
            data.denominations.secondary &&
            !data.denominations.secondary.some((d) => d.base)
        ) {
            RegistrationHelper.logger.error(
                data.source,
                `Failed to register config: ${key}. Reason: Secondary denominations must have a base denomination.`,
            );
            return false;
        }

        // Get base denomination
        const baseDenomination = data.denominations.primary.find(
            (d) => d.base,
        )!;

        // Ensure base denomination has a unit
        if (!baseDenomination.unit) {
            RegistrationHelper.logger.error(
                data.source,
                `Failed to register config: ${key}. Reason: Base denomination ${baseDenomination.id} must have a unit.`,
            );
            return false;
        }

        CONFIG.COSMERE.currencies[data.id] = {
            label: data.label,
            icon: data.icon,
            denominations: data.denominations,
        };
        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        key,
        data,
        register,
        compareOmitFields: ['icon'], // Omit icon from hash comparison
    });
}
