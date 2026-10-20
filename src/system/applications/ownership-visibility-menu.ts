import { SETTINGS } from '@src/system/settings';
import { SYSTEM_ID } from '../constants';

const baseVisibility = [
    'attributes',
    'defenses',
    'level',
    'resources',
    'skills',
    'expertises',
    'immunities',
    'notesTab',
    'appearance',
    'biography',
    'notes',
    'equipmentTab',
    'effectsTab',
] as const;

const characterVisibility = [
    ...baseVisibility,
    'actionsTab',
    'talentsTab',
    'goalsTab',
    'ancestry',
    'culture',
    'path',
] as const;

const adversaryVisibility = [...baseVisibility, 'features', 'actions'] as const;

type CharacterVisibility = (typeof characterVisibility)[number];
type AdversaryVisibility = (typeof adversaryVisibility)[number];

interface visibilitySettings {
    limited: {
        character: Partial<Record<CharacterVisibility, boolean>>;
        adversary: Partial<Record<AdversaryVisibility, boolean>>;
    };
}

// This gives us a list of all settings with a default of false.
const allVisibilitySettings = {
    limited: {
        character: Object.fromEntries(
            characterVisibility.map((key) => [key, false]),
        ),
        adversary: Object.fromEntries(
            adversaryVisibility.map((key) => [key, false]),
        ),
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

        const visibility = getOwnershipVisibility();

        const keys = [
            ...new Set([
                ...Object.keys(visibility.limited.character),
                ...Object.keys(visibility.limited.adversary),
            ]),
        ];

        const characterRecord = visibility.limited.character as Record<
            string,
            boolean
        >;
        const adversaryRecord = visibility.limited.adversary as Record<
            string,
            boolean
        >;

        const settings = keys.map((key) => ({
            key,

            name: game.i18n.format(
                'SETTINGS.ownershipVisibilityMenu.options.name',
                { label: key },
            ),
            hint: game.i18n.format(
                'SETTINGS.ownershipVisibilityMenu.options.hint',
                { label: key },
            ),

            character: {
                available: Object.hasOwn(visibility.limited.character, key),
                value: characterRecord[key] ?? false,
            },

            adversary: {
                available: Object.hasOwn(visibility.limited.adversary, key),
                value: adversaryRecord[key] ?? false,
            },
        }));
        return Promise.resolve({
            ...context,
            settings,
        });
    }
}
