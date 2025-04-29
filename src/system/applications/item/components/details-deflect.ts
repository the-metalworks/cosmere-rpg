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

        return Object.entries(CONFIG.COSMERE.damageTypes).map(
            ([id, config]) => {
                return {
                    id,
                    label: config.label,
                    active: !(config.ignoreDeflect ?? false),
                };
            },
        );
    }

    private prepareDeflectedTypesString() {
        const item = this.application.item;

        return 'test';
    }
}

// Register the component
DetailsDeflectComponent.register('app-item-details-deflect');
