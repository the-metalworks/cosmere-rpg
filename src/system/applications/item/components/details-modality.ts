import { AnyObject, ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsModalityComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/components/details-modality.hbs';

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            hasModality: this.application.item.hasModality(),
            modalityEnabled:
                this.application.item.hasModality() &&
                this.application.item.system.modality !== null,
        });
    }
}

// Register component
DetailsModalityComponent.register('app-item-details-modality');
