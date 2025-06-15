import {
    CurrencyConfig,
    RegistrationConfig,
    RegistrationLogType,
    RegistrationLog,
} from '@system/types/config';
import { RegistrationHelper } from './helper';

export function getCurrentRegistrations() {
    return RegistrationHelper.COMPLETED;
}

interface CurrencyConfigData extends CurrencyConfig, RegistrationConfig {
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

    const identifier = `currency.${data.id}`;

    // Ensure a base denomination is configured
    if (!data.denominations.primary.some((d) => d.base)) {
        RegistrationHelper.registerLog({
            source: data.source,
            type: RegistrationLogType.Error,
            message: `Failed to register config: ${identifier}. Currency must have a base denomination.`,
        } as RegistrationLog);

        return false;
    }

    if (
        data.denominations.secondary &&
        !data.denominations.secondary.some((d) => d.base)
    ) {
        RegistrationHelper.registerLog({
            source: data.source,
            type: RegistrationLogType.Error,
            message: `Failed to register config: ${identifier}. Secondary denominations must have a base denomination.`,
        } as RegistrationLog);

        return false;
    }

    // Get base denomination
    const baseDenomination = data.denominations.primary.find((d) => d.base)!;

    // Ensure base denomination has a unit
    if (!baseDenomination.unit) {
        RegistrationHelper.registerLog({
            source: data.source,
            type: RegistrationLogType.Error,
            message: `Failed to register config: ${identifier}. Base denomination ${baseDenomination.id} must have a unit.`,
        } as RegistrationLog);

        return false;
    }

    const toRegister = {
        label: data.label,
        icon: data.icon,
        denominations: data.denominations,
    } as CurrencyConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.currencies[data.id] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.currencies) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.currencies[data.id],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}
