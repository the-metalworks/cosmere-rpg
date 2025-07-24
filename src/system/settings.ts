import { SYSTEM_ID } from './constants';
import { Theme } from './types/cosmere';
import { setTheme } from './utils/templates';

/**
 * Index of identifiers for system settings.
 */
export const SETTINGS = {
    INTERNAL_FIRST_CREATION: 'firstTimeWorldCreation',
    INTERNAL_LATEST_VERSION: 'latestVersion',
    DIALOG_ROLL_SKIP_DEFAULT: 'skipRollDialogByDefault',
    DIALOG_DAMAGE_MODIFIER_SKIP_DEFAULT: 'skipDamageModDialogByDefault',
    CHAT_ENABLE_OVERLAY_BUTTONS: 'enableOverlayButtons',
    CHAT_ENABLE_APPLY_BUTTONS: 'enableApplyButtons',
    CHAT_ALWAYS_SHOW_BUTTONS: 'alwaysShowApplyButtons',
    APPLY_BUTTONS_TO: 'applyButtonsTo',
    SHEET_EXPAND_DESCRIPTION_DEFAULT: 'expandDescriptionByDefault',
    SHEET_SKILL_INCDEC_TOGGLE: 'skillIncrementDecrementToggle',
    SYSTEM_THEME: 'systemTheme',
} as const;

export const enum TargetingOptions {
    SelectedOnly = 0,
    TargetedOnly = 1,
    SelectedAndTargeted = 2,
    PrioritiseSelected = 3,
    PrioritiseTargeted = 4,
}

/**
 * Register all of the system's settings.
 */
export function registerSystemSettings() {
    game.settings!.register(SYSTEM_ID, SETTINGS.INTERNAL_FIRST_CREATION, {
        name: 'First Time World Creation',
        scope: 'world',
        config: false,
        default: true,
        type: Boolean,
    });

    game.settings!.register(SYSTEM_ID, SETTINGS.INTERNAL_LATEST_VERSION, {
        name: 'Latest Version',
        scope: 'world',
        config: false,
        default: '0.0.0',
        type: String,
    });

    // SHEET SETTINGS
    const sheetOptions = [
        {
            name: SETTINGS.SHEET_EXPAND_DESCRIPTION_DEFAULT,
            default: false,
            scope: 'client',
        },
        {
            name: SETTINGS.SHEET_SKILL_INCDEC_TOGGLE,
            default: false,
            scope: 'client',
        },
    ];

    sheetOptions.forEach((option) => {
        game.settings!.register(SYSTEM_ID, option.name, {
            name: game.i18n!.localize(`SETTINGS.${option.name}.name`),
            hint: game.i18n!.localize(`SETTINGS.${option.name}.hint`),
            scope: option.scope as 'client' | 'world' | undefined,
            config: true,
            type: Boolean,
            default: option.default,
        });
    });

    // DIALOG SKIP SETTINGS
    const dialogOptions = [
        { name: SETTINGS.DIALOG_ROLL_SKIP_DEFAULT, default: false },
        { name: SETTINGS.DIALOG_DAMAGE_MODIFIER_SKIP_DEFAULT, default: true },
    ];

    dialogOptions.forEach((option) => {
        game.settings!.register(SYSTEM_ID, option.name, {
            name: game.i18n!.localize(`SETTINGS.${option.name}.name`),
            hint: game.i18n!.localize(`SETTINGS.${option.name}.hint`),
            scope: 'client',
            config: true,
            type: Boolean,
            default: option.default,
        });
    });

    // CHAT SETTINGS
    const chatOptions = [
        { name: SETTINGS.CHAT_ENABLE_OVERLAY_BUTTONS, default: true },
        { name: SETTINGS.CHAT_ENABLE_APPLY_BUTTONS, default: true },
        { name: SETTINGS.CHAT_ALWAYS_SHOW_BUTTONS, default: true },
    ];

    chatOptions.forEach((option) => {
        game.settings!.register(SYSTEM_ID, option.name, {
            name: game.i18n!.localize(`SETTINGS.${option.name}.name`),
            hint: game.i18n!.localize(`SETTINGS.${option.name}.hint`),
            scope: 'client',
            config: true,
            type: Boolean,
            default: option.default,
            requiresReload: true,
        });
    });

    game.settings!.register(SYSTEM_ID, SETTINGS.APPLY_BUTTONS_TO, {
        name: game.i18n!.localize(`SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.name`),
        hint: game.i18n!.localize(`SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.hint`),
        scope: 'client',
        config: true,
        type: Number,
        default: TargetingOptions.SelectedOnly as number,
        requiresReload: true,
        choices: {
            [TargetingOptions.SelectedOnly]: game.i18n!.localize(
                `SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.choices.SelectedOnly`,
            ),
            [TargetingOptions.TargetedOnly]: game.i18n!.localize(
                `SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.choices.TargetedOnly`,
            ),
            [TargetingOptions.SelectedAndTargeted]: game.i18n!.localize(
                `SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.choices.SelectedAndTargeted`,
            ),
            [TargetingOptions.PrioritiseSelected]: game.i18n!.localize(
                `SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.choices.PrioritiseSelected`,
            ),
            [TargetingOptions.PrioritiseTargeted]: game.i18n!.localize(
                `SETTINGS.${SETTINGS.APPLY_BUTTONS_TO}.choices.PrioritiseTargeted`,
            ),
        },
    });
}

/**
 * Register additional settings after modules have had a chance to initialize to give them a chance to modify choices.
 */
export function registerDeferredSettings() {
    game.settings!.register(SYSTEM_ID, SETTINGS.SYSTEM_THEME, {
        name: game.i18n!.localize(`SETTINGS.${SETTINGS.SYSTEM_THEME}.name`),
        hint: game.i18n!.localize(`SETTINGS.${SETTINGS.SYSTEM_THEME}.hint`),
        scope: 'client',
        config: true,
        type: String,
        default: Theme.Default,
        choices: {
            ...CONFIG.COSMERE.themes,
        },
        onChange: (s) => setTheme(document.body, s),
    });

    setTheme(document.body, getSystemSetting(SETTINGS.SYSTEM_THEME));
}

/**
 * Index of identifiers for system keybindings.
 */
export const KEYBINDINGS = {
    SKIP_DIALOG_DEFAULT: 'skipDialogDefault',
    SKIP_DIALOG_ADVANTAGE: 'skipDialogAdvantage',
    SKIP_DIALOG_DISADVANTAGE: 'skipDialogDisadvantage',
    SKIP_DIALOG_RAISE_STAKES: 'skipDialogRaiseStakes',
    CHANGE_QUANTITY_BY_5: 'changeQuantity5',
    CHANGE_QUANTITY_BY_10: 'changeQuantity10',
    CHANGE_QUANTITY_BY_50: 'changeQuantity50',
} as const;

/**
 * Register all of the system's keybindings.
 */
export function registerSystemKeybindings() {
    const keybindings = [
        {
            name: KEYBINDINGS.SKIP_DIALOG_DEFAULT,
            editable: [{ key: 'AltLeft' }, { key: 'AltRight' }],
        },
        {
            name: KEYBINDINGS.SKIP_DIALOG_ADVANTAGE,
            editable: [{ key: 'ShiftLeft' }, { key: 'ShiftRight' }],
        },
        {
            name: KEYBINDINGS.SKIP_DIALOG_DISADVANTAGE,
            editable: [
                { key: 'ControlLeft' },
                { key: 'ControlRight' },
                { key: 'OsLeft' },
                { key: 'OsRight' },
            ],
        },
        {
            name: KEYBINDINGS.SKIP_DIALOG_RAISE_STAKES,
            editable: [{ key: 'KeyQ' }],
        },
        {
            name: KEYBINDINGS.CHANGE_QUANTITY_BY_5,
            editable: [{ key: 'ShiftLeft' }, { key: 'ShiftRight' }],
        },
        {
            name: KEYBINDINGS.CHANGE_QUANTITY_BY_10,
            editable: [
                { key: 'ControlLeft' },
                { key: 'ControlRight' },
                { key: 'OsLeft' },
                { key: 'OsRight' },
            ],
        },
        {
            name: KEYBINDINGS.CHANGE_QUANTITY_BY_50,
            editable: [{ key: 'AltLeft' }, { key: 'AltRight' }],
        },
    ];

    keybindings.forEach((keybind) => {
        game.keybindings!.register(SYSTEM_ID, keybind.name, {
            name: `KEYBINDINGS.${keybind.name}`,
            editable: keybind.editable,
        });
    });
}

/**
 * Retrieve a specific setting value for the provided key.
 * @param settingKey The identifier of the setting to retrieve.
 * @returns The value of the setting as set for the world/client.
 */
export function getSystemSetting<
    T extends string | boolean | number = string | boolean | number,
>(settingKey: string) {
    return game.settings!.get(SYSTEM_ID, settingKey) as T;
}

/**
 * Set a specific setting value for the provided key.
 * @param settingKey  The identifier of the setting to set.
 * @param value The value to set the setting to.
 */
export function setSystemSetting<T = unknown>(settingKey: string, value: T) {
    return game.settings!.set(SYSTEM_ID, settingKey, value);
}

/**
 * Retrieves an array of keybinding values for the provided key.
 * @param {string} keybindingKey The identifier of the keybinding to retrieve.
 * @returns {Array<object>} The value of the keybindings associated with the given key.
 */
export function getSystemKeybinding(keybindingKey: string) {
    return game.keybindings!.get(SYSTEM_ID, keybindingKey);
}
