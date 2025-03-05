import { TalentItem } from '@system/documents/item';
import { Talent } from '@system/types/item';
import { AnyObject } from '@system/types/utils';
import { CollectionField } from '@system/data/fields';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

type GrantRuleData = { _id: string } & Talent.GrantRule;

export class EditTalentGrantRuleDialog extends ComponentHandlebarsApplicationMixin(
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
                title: 'DIALOG.EditGrantRule.Title',
                minimizable: false,
                resizable: false,
                positioned: true,
            },
            classes: ['dialog', 'edit-grant-rule'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                update: this.onUpdateGrantRule,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_EDIT_GRANT_RULE}`,
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
        private talent: TalentItem,
        private rule: GrantRuleData,
    ) {
        super({
            id: `${talent.uuid}.GrantRule.${rule._id}`,
        });
    }

    /* --- Statics --- */

    public static async show(talent: TalentItem, rule: GrantRuleData) {
        const dialog = new this(talent, rule);
        await dialog.render(true);
    }

    /* --- Actions --- */

    private static onUpdateGrantRule(this: EditTalentGrantRuleDialog) {
        void this.talent.update({
            [`system.grantRules.${this.rule._id}`]: this.rule,
        });
        void this.close();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: EditTalentGrantRuleDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        event.preventDefault();

        if (event instanceof SubmitEvent) return;

        // Get type
        this.rule.type = formData.get('type') as Talent.GrantRule.Type;

        if (
            this.rule.type === Talent.GrantRule.Type.Items &&
            formData.has('items')
        ) {
            this.rule.items = formData.object.items as unknown as string[];
        }

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
            talent: this.talent,
            schema: (
                this.talent.system.schema.fields
                    .grantRules as CollectionField<foundry.data.fields.SchemaField>
            ).model,
            ...this.rule,
        });
    }
}
