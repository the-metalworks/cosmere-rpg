import { getSystemSetting, SETTINGS } from '@src/system/settings';
import {
    ComponentHandlebarsApplicationMixin,
    HandlebarsApplicationComponent,
} from './component-system';
import { SYSTEM_ID } from '../constants';

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
        },
        position: {
            width: 660,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/general/ownership-visibility-menu.hbs',
                forms: {
                    form: {
                        handler: this.onSettingsSubmitted,
                    },
                },
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

        const visibility = getSystemSetting(SETTINGS.LIMITED_VISIBILITY);

        return Promise.resolve({
            ...context,
            visibility,
        });
    }
}
