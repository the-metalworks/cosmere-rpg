import { Theme } from '@system/types/cosmere';
import { RegistrationConfig } from '../types/config';
import { RegistrationHelper } from './helper';

interface ThemeConfigData extends RegistrationConfig {
    id: string;
    label: string;
}

export function registerTheme(data: ThemeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `theme.${data.id}`;

    const toRegister = data.label;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.themes[data.id as Theme] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.themes) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (CONFIG.COSMERE.themes[data.id as Theme] === toRegister) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}
