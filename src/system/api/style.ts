import { Theme } from '@system/types/cosmere';

interface ThemeConfigData {
    id: string;
    label: string;
}

export function registerTheme(data: ThemeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.themes && !force)
        throw new Error('Cannot override existing theme config.');

    if (force) {
        console.warn('Registering theme with force=true.');
    }

    // Add to themes config
    CONFIG.COSMERE.themes[data.id as Theme] = data.label;
}
