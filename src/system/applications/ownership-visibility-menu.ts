import { SETTINGS } from '@src/system/settings';
import { SYSTEM_ID } from '../constants';

const baseVisibility = [
    { key: 'attributes', order: 10 },
    { key: 'defenses', order: 20 },
    { key: 'level', order: 30 },
    { key: 'resources', order: 40 },
    { key: 'skills', order: 50 },
    { key: 'expertises', order: 60 },
    { key: 'immunities', order: 70 },
    { key: 'notesTab', order: 150 },
    { key: 'appearance', order: 151 },
    { key: 'biography', order: 152 },
    { key: 'notes', order: 153 },
    { key: 'equipmentTab', order: 130 },
    { key: 'effectsTab', order: 160 },
] as const;

const characterVisibility = [
    { key: 'ancestry', order: 80 },
    { key: 'culture', order: 90 },
    { key: 'path', order: 100 },
    { key: 'actionsTab', order: 110 },
    { key: 'talentsTab', order: 120 },
    { key: 'goalsTab', order: 140 },
] as const;

const adversaryVisibility = [
    { key: 'features', order: 75 },
    { key: 'actions', order: 76 },
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
                'SETTINGS.ownershipVisibilityMenu.options.name',
                {
                    // This regex translates camel case into how one would read it normally
                    label: setting.key
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .toLowerCase(),
                },
            ),
            hint: game.i18n.format(
                'SETTINGS.ownershipVisibilityMenu.options.hint',
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
