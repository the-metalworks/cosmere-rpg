import { ItemType } from '@system/types/cosmere';

// Documents
import type { CosmereItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import type { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class ItemActionsListComponent extends HandlebarsApplicationComponent<
    // TODO: resolve typing issues
    //@ts-expect-error Workaround for foundry-vtt-types issues
    typeof BaseItemSheet
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_ACTIONS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'create-action': this.onCreateAction,
        'edit-action': this.onEditAction,
        'delete-action': this.onDeleteAction,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Accessors --- */

    public get item(): CosmereItem {
        return this.application.item;
    }

    /* --- Actions --- */

    private static async onCreateAction(this: ItemActionsListComponent) {
        const action = await Item.create(
            {
                type: ItemType.Action,
                name: game.i18n.localize(
                    'COSMERE.Item.Sheet.ActionsList.NewAction.Name',
                ),
                img: this.item.img,
            },
            // @ts-expect-error foundry-vtt-types doesn't correctly resolve the Item.Parent type for the operation's parent property
            { parent: this.item },
        );

        void action?.sheet?.render(true);
        void this.render();
    }

    private static onEditAction(this: ItemActionsListComponent, event: Event) {
        console.log('onEditAction', event);

        // Get id
        const id = $(event.target!).closest('.action[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        console.log('Action id:', id);

        // Get action
        const action = this.item.items.get(id);
        if (!action) return;

        console.log('Action:', action);

        void action.sheet?.render(true);
    }

    private static onDeleteAction(
        this: ItemActionsListComponent,
        event: Event,
    ) {
        // Get id
        const id = $(event.target!).closest('.action[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Get action
        const action = this.item.items.get(id);
        if (!action) return;

        void action.deleteDialog();
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        return Promise.resolve({
            ...context,
            actions: this.item.actions,
        });
    }
}

ItemActionsListComponent.register('app-item-actions-list');
