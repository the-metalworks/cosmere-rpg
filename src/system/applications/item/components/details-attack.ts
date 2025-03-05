import { AttackType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsAttackComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_ATTACK}`;

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            ...this.prepareAttackContext(),
            hasAttack: this.application.item.hasAttack(),
        });
    }

    private prepareAttackContext() {
        if (!this.application.item.hasAttack()) return {};

        const item = this.application.item;
        const hasRange = item.system.attack.range;

        return {
            hasRange,
            attackTypeSelectOptions: Object.entries(
                CONFIG.COSMERE.attack.types,
            ).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
            rangeUnitSelectOptions: {
                ...(item.system.attack.type === AttackType.Melee
                    ? {
                          none: 'GENERIC.None',
                      }
                    : {}),
                ...Object.entries(CONFIG.COSMERE.units.distance).reduce(
                    (acc, [key, label]) => ({
                        ...acc,
                        [key]: label,
                    }),
                    {},
                ),
            },
        };
    }
}

// Register the component
DetailsAttackComponent.register('app-item-details-attack');
