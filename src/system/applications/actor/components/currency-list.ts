import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

export class ActorCurrencyListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_CURRENCY_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    static ACTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.ACTIONS),
        {},
    );

    /* --- Context --- */

    public async _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            currencies: await Promise.all(
                Object.keys(CONFIG.COSMERE.currencies).map(
                    this.prepareCurrency.bind(this),
                ),
            ),
        });
    }

    private async prepareCurrency(currencyId: string) {
        const currencyConfig = foundry.utils.duplicate(
            CONFIG.COSMERE.currencies[currencyId],
        );

        try {
            await FilePicker.browse('data', currencyConfig.icon ?? '');
        } catch (ex) {
            currencyConfig.icon = undefined;
        }

        return {
            id: currencyId,
            config: currencyConfig,
            total: this.application.actor.system.currency[currencyId].total,
        };
    }
}

// Register
ActorCurrencyListComponent.register('app-actor-currency-list');
