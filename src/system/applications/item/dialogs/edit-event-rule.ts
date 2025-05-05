import { CosmereItem } from '@src/system/documents';
import { Rule } from '@system/data/item/event-system';

import { Events as EventSystem } from '@system/types/item';
import { AnyObject } from '@system/types/utils';

// Component imports
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

export class ItemEditEventRuleDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                title: 'DIALOG.EditEventRule.Title',
                minimizable: false,
                resizable: false,
                positioned: true,
            },
            classes: ['dialog', 'edit-event-rule'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                update: this.onUpdateRule,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_EDIT_EVENT_RULE}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private constructor(
        private item: CosmereItem,
        private rule: Rule,
    ) {
        super({
            id: `${item.uuid}.Events.${rule.id}`,
        });
    }

    /* --- Statics --- */

    public static async show(item: CosmereItem, rule: Rule) {
        const dialog = new this(item, foundry.utils.deepClone(rule));
        await dialog.render(true);
    }

    /* --- Actions --- */

    private static onUpdateRule(this: ItemEditEventRuleDialog) {
        void this.item.update({
            [`system.events.${this.rule.id}`]: this.rule.toJSON(),
        });
        void this.close();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: ItemEditEventRuleDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        event.preventDefault();

        // Ignore submit events
        if (event instanceof SubmitEvent) return;

        // Update the rule with the form data
        this.rule.updateSource(formData.object);

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    public _prepareContext() {
        return Promise.resolve({
            editable: true,
            item: this.item,
            rule: this.rule,
        });
    }
}
