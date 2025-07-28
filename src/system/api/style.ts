import { Theme } from '@system/types/cosmere';
import { CommonRegistrationData } from './types';
import { RegistrationHelper } from './helper';

interface ThemeConfigData extends CommonRegistrationData {
    id: string;
    label: string;
}

export function registerTheme(data: ThemeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const key = `themes.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.themes[data.id as Theme] = data.label;

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        key,
        data,
        register,
    });
}
