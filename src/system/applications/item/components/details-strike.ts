import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheetRenderContext } from '../base';
import { DieSize, Skill } from '@src/system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

export class DetailsStrikeComponent extends HandlebarsApplicationComponent<// typeof BaseItemSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_STRIKE}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-skill-lock': this.onToggleSkillLock,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Accessors --- */

    public get item(): CosmereItem {
        return this.application.item;
    }

    /* --- Actions --- */

    private static async onToggleSkillLock(
        this: DetailsStrikeComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.item.hasStrike()) return;

        const skillUnlocked = this.item.system.strike.skillLocked;

        await this.item.update({
            system: { strike: { skillLocked: !skillUnlocked } },
        });
        void this.render();
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            ...this.prepareStrikeContext(),
            hasStrike: this.item.hasStrike(),
        });
    }

    private prepareStrikeContext() {
        if (!this.item.hasStrike()) return {};

        return {
            isSpecialWeapon: this.item.isSpecialWeapon,
            lockSkillSelect:
                !this.item.isSpecialWeapon &&
                this.item.system.strike.skillLocked,
            dieSizeSelectOptions: {
                ...Object.values(DieSize).reduce(
                    (acc, dieSize) => ({
                        ...acc,
                        [dieSize]: dieSize,
                    }),
                    {},
                ),
            },
            damageTypeSelectOptions: {
                ...Object.entries(CONFIG.COSMERE.damageTypes).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            skillSelectOptions: {
                ...Object.entries(CONFIG.COSMERE.skills).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
        };
    }
}

// Register the component
DetailsStrikeComponent.register('app-item-details-strike');
