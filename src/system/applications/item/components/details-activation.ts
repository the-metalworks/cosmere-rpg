import { ActivationType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsActivationComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/components/details-activation.hbs';

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
            hasConsume: !!activation.consume,
            hasUses: !!activation.uses,
            hasSkill: !!activation.skill,

            typeSelectOptions: Object.entries(
                CONFIG.COSMERE.items.activation.types,
            ).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
            costTypeSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(CONFIG.COSMERE.action.costs).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            consumeTypeSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.items.activation.consumeTypes,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            resourceSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(CONFIG.COSMERE.resources).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            usesTypeSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.items.activation.uses.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.labelPlural,
                    }),
                    {},
                ),
            },
            rechargeSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.items.activation.uses.recharge,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            skillSelectOptions: {
                none: 'GENERIC.None',
                ...Object.entries(CONFIG.COSMERE.skills).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            attributeSelectOptions: {
                none: 'GENERIC.None',
                default: 'GENERIC.Default',
                ...Object.entries(CONFIG.COSMERE.attributes).reduce(
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
DetailsActivationComponent.register('app-item-details-activation');
