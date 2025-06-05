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

export class DetailsActivationComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
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
        if (!this.application.item.hasActivation()) return;

        // Get the activation data
        const { activation } = this.application.item.system;

        activation.consume?.push({
            type: ItemConsumeType.Resource,
            value: {
                min: 0,
                max: 0,
            },
            resource: Resource.Focus,
        });

        void this.application.item.update({
            ['system.activation.consume']: activation.consume,
        });
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            ...this.prepareActivationContext(),
            hasActivation: this.application.item.hasActivation(),
        });
    }

    private prepareActivationContext() {
        if (!this.application.item.hasActivation()) return {};

        // Get the activation data
        const { activation } = this.application.item.system;

        return {
            hasActivationType: activation.type !== ActivationType.None,
            hasActivationCost: !!activation.cost.type,
            consume: activation.consume,
            hasUses: !!activation.uses,
            hasSkill: !!activation.resolvedSkill,

            usesTypeSelectOptions: {
                [NONE]: 'GENERIC.None',
                ...((
                    (
                        this.application.item
                            .system as unknown as foundry.abstract.DataModel
                    ).schema.getField(
                        'activation.uses.type',
                    ) as foundry.data.fields.StringField
                ).options.choices as AnyObject),
            },
            consumeTypeSelectOptions: {
                '': 'GENERIC.None',
                ...((
                    (
                        this.application.item
                            .system as unknown as foundry.abstract.DataModel
                    ).schema.getField(
                        'activation.consume.element.type',
                    ) as foundry.data.fields.StringField
                ).options.choices as AnyObject),
            },
        };
    }
}

// Register the component
DetailsActivationComponent.register('app-item-details-activation');
