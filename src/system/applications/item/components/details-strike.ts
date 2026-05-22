import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';
import { DieSize } from '@src/system/types/cosmere';

export class DetailsStrikeComponent extends HandlebarsApplicationComponent<// typeof BaseItemSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_STRIKE}`;

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            ...this.prepareStrikeContext(),
            hasStrike: this.application.item.hasStrike(),
        });
    }

    private prepareStrikeContext() {
        if (!this.application.item.hasStrike()) return {};

        const item = this.application.item;

        return {
            isSpecialWeapon: item.isSpecialWeapon,
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
