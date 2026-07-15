import { ActionItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

// Utils
import AppUtils from '@system/applications/utils';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { ActorItemListComponent } from './item-list';

interface ActionsListEntryComponentParams {
    item: ActionItem;
}

export class ActionsListEntryComponent extends ActorItemListComponent {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ACTIONS_LIST_ENTRY}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        ...super.ACTIONS,
        'use-item': this.onUseItem,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Context --- */

    public async _prepareContext(
        params: unknown,
        context: BaseActorSheetRenderContext,
    ) {
        const item = (params as ActionsListEntryComponentParams).item;

        if (!(item.id! in this.itemState)) {
            this.itemState[item.id!] = {
                expanded: false,
            };
        }

        const descriptionHTML =
            await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                item.system.description.value,
                {
                    relativeTo: item,
                },
            );

        return {
            ...context,
            item,
            descriptionHTML,
            expanded: this.itemState[item.id!].expanded,
        };
    }
}

ActionsListEntryComponent.register('app-actor-actions-list-entry');
