import {
    CurrencyConfig,
    CurrencyDenominationConfig,
} from '@system/types/config';
import { CommonRegistrationData } from './types';
import { SYSTEM_ID } from '../constants';
import { RegistrationHelper } from './helper';

interface CurrencyConfigData extends CurrencyConfig, CommonRegistrationData {
    /**
     * Unique id for the currency.
     */
    id: string;
}

const CurrencyConfig: Omit<CurrencyConfigData, 'source'>[] = [];

export class CurrencyConfigBuilder {
    #currency?: Omit<CurrencyConfigData, 'source'> = undefined;
    #primary: CurrencyDenominationConfig[] = [];
    #secondary?: CurrencyDenominationConfig[] = undefined;

    constructor(id: string, label: string, icon?: string) {
        if (!icon) {
            icon = `systems/cosmere-rpg/assets/icons/currency/default.webp`;
        }
        this.#currency = {
            id,
            label,
            icon,
            denominations: {
                primary: this.#primary,
                secondary: this.#secondary,
            },
        };
    }

    build() {
        if (!this.#currency) {
            throw new Error(
                'CurrencyConfigBuilder: No currency data to build.',
            );
        }
        if (this.#primary.length === 0) {
            throw new Error(
                'CurrencyConfigBuilder: At least one primary denomination is required.',
            );
        }
        return this.#currency as CurrencyConfigData;
    }

    addPrimaryDenomination(denomination: CurrencyDenominationConfig) {
        if (this.#primary.find((d) => d.id === denomination.id)) {
            console.warn(
                `Denomination with id ${denomination.id} is already configured as a primary denomination. Skipping.`,
            );
            return;
        }
        this.#primary.push(denomination);
    }

    addSecondaryDenomination(denomination: CurrencyDenominationConfig) {
        if (!this.#secondary) {
            this.#secondary = [];
            if (this.#currency)
                this.#currency.denominations.secondary = this.#secondary;
        }
        if (this.#secondary.find((d) => d.id === denomination.id)) {
            console.warn(
                `Denomination with id ${denomination.id} is already configured as a secondary denomination. Skipping.`,
            );
            return;
        }
        this.#secondary.push(denomination);
    }
}

export function addCurrency(currency: CurrencyConfigData) {
    if (CurrencyConfig.find((c) => c.id === currency.id)) {
        console.warn(
            `Currency with id ${currency.id} is already configured. Skipping.`,
        );
        return;
    }
    CurrencyConfig.push(currency);
}

export function registerBuiltCurrency() {
    for (const currency of CurrencyConfig) {
        cosmereRPG.api.registerCurrency({
            source: SYSTEM_ID,
            ...currency,
        });
    }
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
