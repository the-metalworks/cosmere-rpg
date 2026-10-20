import { SETTINGS } from '@src/system/settings';
import { SYSTEM_ID } from '../constants';

/**
 * Generic means whether or not it uses the generic setting name and hint
 */
const baseVisibility = [
    { key: 'attributes', order: 10, generic: true },
    { key: 'defenses', order: 20, generic: true },
    { key: 'level', order: 30, generic: true },
    { key: 'resourceBars', order: 39, generic: false },
    { key: 'resourceValues', order: 40, generic: true },
    { key: 'skills', order: 50, generic: true },
    { key: 'expertises', order: 60, generic: true },
    { key: 'immunities', order: 70, generic: true },
    { key: 'notesTab', order: 150, generic: true },
    { key: 'appearance', order: 151, generic: true },
    { key: 'biography', order: 152, generic: true },
    { key: 'notes', order: 153, generic: true },
    { key: 'equipmentTab', order: 130, generic: true },
    { key: 'effectsTab', order: 160, generic: true },
] as const;

const characterVisibility = [
    { key: 'ancestry', order: 80, generic: true },
    { key: 'culture', order: 90, generic: true },
    { key: 'path', order: 100, generic: true },
    { key: 'actionsTab', order: 110, generic: true },
    { key: 'talentsTab', order: 120, generic: true },
    { key: 'goalsTab', order: 140, generic: true },
] as const;

const adversaryVisibility = [
    { key: 'features', order: 75, generic: true },
    { key: 'actions', order: 76, generic: true },
] as const;

type BaseVisibility = (typeof baseVisibility)[number]['key'];
type CharacterVisibility = (typeof characterVisibility)[number]['key'];
type AdversaryVisibility = (typeof adversaryVisibility)[number]['key'];

interface visibilitySettings {
    limited: {
        character: Partial<
            Record<BaseVisibility | CharacterVisibility, boolean>
        >;
        adversary: Partial<
            Record<BaseVisibility | AdversaryVisibility, boolean>
        >;
    };
}

// This gives us a list of all settings with a default of false.
const allVisibilitySettings = {
    limited: {
        character: Object.fromEntries([
            ...baseVisibility.map((entry) => [entry.key, false]),
            ...characterVisibility.map((entry) => [entry.key, false]),
        ]) as [key: string, boolean][],
        adversary: Object.fromEntries([
            ...baseVisibility.map((entry) => [entry.key, false]),
            ...adversaryVisibility.map((entry) => [entry.key, false]),
        ]) as [key: string, boolean][],
    },
};

/**
 * Default values for actor visibility settings
 * Note that we need to define all of the settings here so they are
 */
const baseActorSheetVisibility = {
    // Sections
    attributes: true,
    defenses: true,
    level: true,
    resourceBars: true,
    expertises: true,
    appearance: true,
    // Tabs
    notesTab: true,
    effectsTab: true,
};

/**
 * The default settings for visibility settings. This is used to reset to default.
 */
export const defaultSheetVisibility: visibilitySettings = {
    limited: {
        character: {
            ...baseActorSheetVisibility,

            ancestry: true,
            culture: true,
            path: true,
        },

        adversary: {
            ...baseActorSheetVisibility,
        },
    },
};

/**
 * This combines the default settings with the saved settings should they exist.
 * This is because if we ever update the settings data with more fields, this will
 * automatically add it to the settings and ensure we get no errors.
 * @returns visibilitySettings
 */
export function getOwnershipVisibility(): visibilitySettings {
    const savedVisibility = game.settings.get(
        SYSTEM_ID,
        SETTINGS.LIMITED_VISIBILITY,
    ) as visibilitySettings;

    // Merges all settings with default settings, letting default override.
    // This is because if we ever add more settings, the data model gets updated properly
    const visibility = foundry.utils.mergeObject(
        foundry.utils.deepClone(allVisibilitySettings),
        defaultSheetVisibility,
    ) as visibilitySettings;

    // This merges all settings with defaults applied with the existing settings
    // This will fill all the remaining gaps should there be any without overwriting any existing settings
    foundry.utils.mergeObject(visibility, savedVisibility);

    return visibility;
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OwnershipVisibilityMenu extends HandlebarsApplicationMixin(
    ApplicationV2,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        id: 'ownership-visibility-menu',
        tag: 'form',
        window: {
            title: `SETTINGS.ownershipVisibilityMenu.menu.name`,
            minimizable: false,
            positioned: true,
            scroll: true,
        },
        position: {
            width: 660,
        },
        actions: {
            reset: this.onResetToDefault,
        },
        form: {
            handler: this.onSettingsSubmitted,
            closeOnSubmit: true,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/general/ownership-visibility-menu.hbs',
                scrollable: ['.visibility-list'],
            },
        },
    );

    static async onResetToDefault(
        this: OwnershipVisibilityMenu,
        event: PointerEvent,
        target: HTMLElement,
    ) {
        await game.settings.set(
            SYSTEM_ID,
            SETTINGS.LIMITED_VISIBILITY,
            defaultSheetVisibility,
        );
        await this.close();
    }

    static async onSettingsSubmitted(
        this: void,
        event: SubmitEvent | Event,
        form: HTMLFormElement,
        formData: foundry.applications.ux.FormDataExtended,
    ) {
        const visibility = foundry.utils.expandObject(formData.object);

        await game.settings.set(
            SYSTEM_ID,
            SETTINGS.LIMITED_VISIBILITY,
            visibility,
        );
    }

    async _prepareContext(
        options: foundry.applications.types.ApplicationRenderOptions,
    ) {
        const context = await super._prepareContext(options);

        const visibilityKeySorted = [
            ...baseVisibility,
            ...adversaryVisibility,
            ...characterVisibility,
        ].sort((a, b) => a.order - b.order);

        const visibilityData = getOwnershipVisibility();

        const characterRecord = visibilityData.limited.character as Record<
            string,
            boolean
        >;
        const adversaryRecord = visibilityData.limited.adversary as Record<
            string,
            boolean
        >;

        const settings = visibilityKeySorted.map((setting) => ({
            key: setting.key,

            name: game.i18n.format(
                !setting.generic
                    ? `SETTINGS.ownershipVisibilityMenu.${setting.key}.name`
                    : 'SETTINGS.ownershipVisibilityMenu.options.name',
                {
                    // Converts camel case into normal spacing
                    label: setting.key
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .toLowerCase(),
                },
            ),
            hint: game.i18n.format(
                !setting.generic
                    ? `SETTINGS.ownershipVisibilityMenu.${setting.key}.hint`
                    : 'SETTINGS.ownershipVisibilityMenu.options.hint',
                {
                    label: setting.key
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .toLowerCase(),
                },
            ),

            character: {
                available: Object.hasOwn(
                    visibilityData.limited.character,
                    setting.key,
                ),
                value: characterRecord[setting.key] ?? false,
            },

            adversary: {
                available: Object.hasOwn(
                    visibilityData.limited.adversary,
                    setting.key,
                ),
                value: adversaryRecord[setting.key] ?? false,
            },
        }));
        return Promise.resolve({
            ...context,
            settings,
        });
    }
}
