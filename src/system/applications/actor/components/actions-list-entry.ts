import { ActionItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

// Utils
import AppUtils from '@system/applications/utils';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

interface ActionsListEntryComponentParams {
    item: ActionItem;
}

export class ActionsListEntryComponent extends HandlebarsApplicationComponent<
    // TODO: Resolve typing issues
    //@ts-expect-error Workaround for foundry-vtt-types issues
    BaseActorSheet,
    ActionsListEntryComponentParams
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ACTIONS_LIST_ENTRY}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-action-details': this.onToggleActionDetails,
        'use-item': this.onUseItem,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    protected expanded = false;

    /* --- Actions --- */

    public static onToggleActionDetails(
        this: ActionsListEntryComponent,
        event: Event,
    ) {
        // Update the state
        this.expanded = !this.expanded;

        const liElement = $(this.element!).find('li.item');

        // Set classes
        liElement.toggleClass('expanded', this.expanded);

        liElement
            .find('a[data-action="toggle-action-details"')
            .empty()
            .append(
                this.expanded
                    ? '<i class="fa-solid fa-compress"></i>'
                    : '<i class="fa-solid fa-expand"></i>',
            );
    }

    public static onUseItem(this: ActionsListEntryComponent, event: Event) {
        if (!this.item) return;

        // Use the item
        void this.application.actor.useItem(this.item);
    }

    /* --- Accessors --- */

    public get item() {
        return this.params?.item;
    }

    /* --- Context --- */

    public async _prepareContext(
        params: ActionsListEntryComponentParams,
        context: BaseActorSheetRenderContext,
    ) {
        const item = params.item;

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
            expanded: this.expanded,
        };
    }
}

ActionsListEntryComponent.register('app-actor-actions-list-entry');
