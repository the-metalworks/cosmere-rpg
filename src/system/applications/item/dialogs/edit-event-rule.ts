import { CosmereItem } from '@src/system/documents';
import { Rule } from '@system/data/item/event-system';
import { EventsItemData } from '@system/data/item/mixins/events';

import { AnyMutableObject, AnyObject } from '@system/types/utils';

// Component imports
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// Utils
import { getObjectChanges } from '@system/utils/data';

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
                width: 500,
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
        private item: CosmereItem<EventsItemData>,
        private rule: Rule,
    ) {
        super({
            id: `${item.uuid}.Events.${rule.id}`,
        });
    }

    /* --- Statics --- */

    public static async show(item: CosmereItem<EventsItemData>, rule: Rule) {
        const dialog = new this(item, rule.clone() as Rule);
        await dialog.render(true);
    }

    /* --- Actions --- */

    private static onUpdateRule(this: ItemEditEventRuleDialog) {
        // Get changes
        const changes = foundry.utils.mergeObject(
            getObjectChanges(
                this.item.system.events.get(this.rule.id)!.toObject(),
                this.rule.toObject(),
            ),
            {
                /**
                 * NOTE: We have to always include the handler type in the changes
                 * otherwise the handler field cannot determine which schema to use
                 * for validation.
                 */
                'handler.type': this.rule.handler.type,
            },
        );

        void this.item.update({
            [`system.events.${this.rule.id}`]: changes,
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

        // Prepare changes
        const changes = Object.entries(formData.object).reduce(
            (changes, [key, value]) => {
                if (foundry.utils.getType(value) === 'Object') {
                    changes[key] = getObjectChanges(
                        foundry.utils.getProperty(this.rule, key),
                        value as unknown as object,
                    );
                } else {
                    changes[key] = value;
                }

                return changes;
            },
            {} as AnyMutableObject,
        );

        // Update the rule with the form data
        this.rule.updateSource(changes, { fallback: true });

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected async _preRender(context: AnyMutableObject, options: unknown) {
        await super._preRender(context, options);

        // Handle handler config rendering
        const handlerConfigHtml = await this.rule.handler.configRenderer?.({
            ...context,
            event: this.rule.event,
            handler: this.rule.handler,

            // Emulate component system
            __application: this,
            partId: 'form',
        });

        context.shouldAutoPopulateConfigFields = !handlerConfigHtml;
        context.handlerConfigHtml = handlerConfigHtml;
    }

    /* --- Context --- */

    public _prepareContext() {
        const allEventSelectOptions = (
            (this.rule.schema.fields.event as foundry.data.fields.StringField)
                .choices as () => AnyMutableObject
        )();

        // Prepare the context
        return Promise.resolve({
            editable: true,
            item: this.item,
            rule: this.rule,
            eventSelectOptions: Object.entries(allEventSelectOptions)
                .filter(
                    ([event]) =>
                        CONFIG.COSMERE.items.events.types[event]?.filter?.(
                            this.item,
                        ) !== false,
                )
                .reduce(
                    (acc, [event, label]) => ({
                        ...acc,
                        [event]: label,
                    }),
                    {},
                ),
        });
    }
}
