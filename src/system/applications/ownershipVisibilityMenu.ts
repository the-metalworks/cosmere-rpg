import { getSystemSetting, SETTINGS } from '@src/system/settings';
import {
    ComponentHandlebarsApplicationMixin,
    HandlebarsApplicationComponent,
} from './component-system';
import { SYSTEM_ID } from '../constants';
import { characterMeetsPrerequisiteRule } from '../utils/talent-tree';

export interface limitedVisibilitySettings {
    character: {
        // Details Section
        attributes: boolean;
        defenses: boolean;
        level: boolean;
        resources: boolean;
        skills: boolean;
        expertises: boolean;
        immunities: boolean;
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
        biography: boolean;
        notes: boolean;
        // Effects Section
        effectsTab: boolean;
    };
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OwnershipVisibilityMenu extends HandlebarsApplicationMixin(
    ApplicationV2,
) {
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
        forms: {
            form: {
                handler: this.onSettingsSubmitted,
            },
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

        const visibility = game.settings.get(
            SYSTEM_ID,
            SETTINGS.LIMITED_VISIBILITY,
        ) as limitedVisibilitySettings;

        const keys = [
            ...new Set([
                ...Object.keys(visibility.character),
                ...Object.keys(visibility.adversary),
            ]),
        ];

        const characterRecord = visibility.character as Record<string, boolean>;
        const adversaryRecord = visibility.adversary as Record<string, boolean>;

        const settings = keys.map((key) => ({
            key,

            name: `SETTINGS.ownershipVisibilityMenu.${key}.name`,
            hint: `SETTINGS.ownershipVisibilityMenu.${key}.hint`,

            character: {
                available: Object.hasOwn(visibility.character, key),
                value: characterRecord[key] ?? false,
            },

            adversary: {
                available: Object.hasOwn(visibility.adversary, key),
                value: adversaryRecord[key] ?? false,
            },
        }));
        return Promise.resolve({
            ...context,
            settings,
        });
    }
}
