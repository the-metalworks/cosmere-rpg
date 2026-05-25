import {
    ActivationType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';
import type { AnyObject, ConstructorOf } from '@system/types/utils';
import { NONE } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import type { BaseItemSheetRenderContext } from '../base';
import { BaseItemSheet } from '../base';

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

        activation!.consumption?.push({
            type: ItemConsumeType.Resource,
            value: {
                min: 0,
                max: 0,
                actual: 0,
            },
            resource: Resource.Focus,
        });

        void this.application.item.update({
            system: {
                activation: {
                    consumption: activation!.consumption,
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

            usesTypeSelectOptions: {
                [NONE]: 'GENERIC.None',
                ...((
                    (
                        this.application.item
                            .system as unknown as foundry.abstract.DataModel.Any
                    ).schema.getField(
                        'resources.uses.type',
                    ) as foundry.data.fields.StringField
                )?.options.choices as unknown as AnyObject), // TEMP: Workaround
            },
            consumeTypeSelectOptions: {
                '': 'GENERIC.None',
                ...((
                    (
                        this.application.item
                            .system as unknown as foundry.abstract.DataModel.Any
                    ).schema.getField(
                        'activation.consumption.element.type',
                    ) as foundry.data.fields.StringField
                ).options.choices as unknown as AnyObject), // TEMP: Workaround
            },
        };
    }
}

// Register the component
DetailsActivationComponent.register('app-item-details-activation');
