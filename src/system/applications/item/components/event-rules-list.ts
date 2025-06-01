import { CosmereItem } from '@system/documents/item';
import { EventsItemData } from '@system/data/item/mixins/events';
import { ConstructorOf } from '@system/types/utils';

// Dialogs
import { ItemEditEventRuleDialog } from '../dialogs/edit-event-rule';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class ItemEventRulesListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_EVENT_RULES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'create-rule': this.onCreateRule,
        'edit-rule': this.onEditRule,
        'delete-rule': this.onDeleteRule,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Accessors --- */

    public get item(): CosmereItem<EventsItemData> {
        return this.application.item as CosmereItem<EventsItemData>;
    }

    /* --- Actions --- */

    private static async onCreateRule(this: ItemEventRulesListComponent) {
        // Generate id
        const id = foundry.utils.randomID();

        // Create the rule
        await this.item.update({
            [`system.events.${id}`]: {
                id,
                description: game.i18n!.localize(
                    'COSMERE.Item.EventSystem.Event.Rule.NewRuleDescription',
                ),
                event: 'none',
                handler: {
                    type: 'none',
                },
            },
        });

        // Get the rule
        const rule = this.item.system.events.get(id)!;

        // Show the edit dialog
        void ItemEditEventRuleDialog.show(this.item, rule);
    }

    private static onEditRule(this: ItemEventRulesListComponent, event: Event) {
        // Get id
        const id = $(event.target!).closest('.rule[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Get the rule
        const rule = this.item.system.events.get(id);
        if (!rule) return;

        // Show the edit dialog
        void ItemEditEventRuleDialog.show(this.item, rule);
    }

    private static onDeleteRule(
        this: ItemEventRulesListComponent,
        event: Event,
    ) {
        // Get id
        const id = $(event.target!).closest('.rule[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Delete the rule
        void this.item.update({
            [`system.events.-=${id}`]: {},
        });
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        const rules = Array.from(this.item.system.events).sort(
            (a, b) => a.order - b.order,
        );

        return Promise.resolve({
            ...context,
            rules,
        });
    }
}

// Register the component
ItemEventRulesListComponent.register('app-item-event-rules-list');
