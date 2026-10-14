import { DEFAULT_OWNERSHIP_VISIBILITY, SETTINGS } from '@src/system/settings';
import { SYSTEM_ID } from '../constants';

export interface visibilitySettings {
    limited: {
        character: {
            // Details Section
            attributes: boolean;
            defenses: boolean;
            level: boolean;
            resources: boolean;
            skills: boolean;
            expertises: boolean;
            immunities: boolean;
            ancestry: boolean;
            culture: boolean;
            path: boolean;
            // Talents Section
            talentsTab: boolean;
            // Actions Section
            actionsTab: boolean;
            // Equipment Section
            equipmentTab: boolean;
            // Goals Section
            goalsTab: boolean;
            // Notes Section
            notesTab: boolean;
            appearance: boolean;
            biography: boolean;
            notes: boolean;
            // Effects Section
            effectsTab: boolean;
        };
        adversary: {
            // Details Section
            attributes: boolean;
            defenses: boolean;
            level: boolean;
            skills: boolean;
            expertises: boolean;
            immunities: boolean;
            features: boolean;
            actions: boolean;
            // Equipment Section
            equipmentTab: boolean;
            // Notes Section
            notesTab: boolean;
            appearance: boolean;
            biography: boolean;
            notes: boolean;
            // Effects Section
            effectsTab: boolean;
        };
    };
}

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

    // Merges the default settings with the saved settings
    // This is because if we ever add more settings, the data model gets updated.
    const visibility = foundry.utils.mergeObject(
        foundry.utils.deepClone(DEFAULT_OWNERSHIP_VISIBILITY),
        savedVisibility,
    ) as visibilitySettings;

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
            DEFAULT_OWNERSHIP_VISIBILITY,
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

            name: `SETTINGS.ownershipVisibilityMenu.${key}.name`,
            hint: `SETTINGS.ownershipVisibilityMenu.${key}.hint`,

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
