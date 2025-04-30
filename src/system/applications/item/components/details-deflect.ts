import { DamageType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsDeflectComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_DEFLECT}`;

    /* --- Actions --- */

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            deflectedTypes: this.prepareDeflectedTypesData(),
            deflectedTypesString: this.prepareDeflectedTypesString(),
        });
    }

    private prepareDeflectedTypesData() {
        const item = this.application.item;

        if (!item.isArmor()) return null;

        return Object.entries(CONFIG.COSMERE.damageTypes).map(
            ([id, config]) => {
                const deflectData = item.system.deflects[id as DamageType];

                return {
                    id,
                    label: config.label,
                    active: deflectData?.defaultActive,
                };
            },
        );
    }

    private prepareDeflectedTypesString() {
        const item = this.application.item;
        if (!item.hasDeflect()) return null;

        return item.system.deflectsArray
            .filter((deflect) => deflect.defaultActive)
            .map((deflect) => {
                const config = CONFIG.COSMERE.damageTypes[deflect.id];

                return game.i18n!.localize(config.label);
            })
            .join(', ');
    }
}

// Register the component
DetailsDeflectComponent.register('app-item-details-deflect');
