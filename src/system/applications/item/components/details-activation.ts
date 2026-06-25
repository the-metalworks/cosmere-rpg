import {
    ActivationType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';
import { ConstructorOf, NONE, AnyObject } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

export class DetailsActivationComponent extends HandlebarsApplicationComponent<// typeof BaseItemSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_ACTIVATION}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'add-consumption-option': this.addConsumptionOption,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */
    protected static addConsumptionOption(this: DetailsActivationComponent) {
        if (!this.application.item.isAction()) return;

        // Get the activation data
        const { activation } = this.application.item.system;

        void this.application.item.update({
            system: {
                activation: {
                    consumption: [
                        ...activation!.consumption,
                        {
                            type: ItemConsumeType.Resource,
                            value: {
                                min: 0,
                                max: 0,
                                actual: 0,
                            },
                            resource: Resource.Focus,
                        },
                    ],
                },
            },
        });
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            ...this.prepareActivationContext(),
            hasActivation: this.application.item.isAction(),
        });
    }

    private prepareActivationContext() {
        if (!this.application.item.isAction()) return {};

        // Get the activation data
        const { activation } = this.application.item.system;
        if (!activation) return {};

        return {
            hasActivationType: activation.type !== ActivationType.None,
            hasActivationCost: !!activation.cost.type,
            consume: activation.consumption,
            hasUses: !!this.application.item.system.resources.uses,
            hasSkill: !!this.application.item.system.skillTest?.resolvedSkill,
        };
    }
}

// Register the component
DetailsActivationComponent.register('app-item-details-activation');
