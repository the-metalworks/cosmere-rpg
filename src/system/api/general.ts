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

    const identifier = `currency.${data.id}`;

    const register = () => {
        // Ensure a base denomination is configured
        if (!data.denominations.primary.some((d) => d.base)) {
            throw new Error('Currency must have a base denomination.');
        }

        if (
            data.denominations.secondary &&
            !data.denominations.secondary.some((d) => d.base)
        ) {
            throw new Error(
                'Secondary denominations must have a base denomination.',
            );
        }

        // Get base denomination
        const baseDenomination = data.denominations.primary.find(
            (d) => d.base,
        )!;

        // Ensure base denomination has a unit
        if (!baseDenomination.unit) {
            throw new Error(
                `Base denomination ${baseDenomination.id} must have a unit.`,
            );
        }

        CONFIG.COSMERE.currencies[data.id] = {
            label: data.label,
            icon: data.icon,
            denominations: data.denominations,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
        hashOmitFields: ['icon'], // Omit icon from hash comparison
    });
}
