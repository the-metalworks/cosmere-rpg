import { BonusTalentsRule } from '@system/data/item/ancestry';
import { AnyObject } from '@system/types/utils';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EditBonusTalentsRuleDialog extends HandlebarsApplicationMixin(
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
                title: 'DIALOG.EditBonusTalentsRule.Title',
                minimizable: false,
                resizable: true,
                positioned: true,
            },
            classes: ['dialog', 'edit-bonus-talents-rule'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                update: this.onSubmit,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/item/ancestry/dialogs/edit-bonus-talents-rule.hbs',
                forms: {
                    form: {
                        handler: this.onFormEvent,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private rule: BonusTalentsRule;
    private submitted = false;

    private constructor(
        rule: BonusTalentsRule,
        private resolve: (value: BonusTalentsRule | null) => void,
    ) {
        super({});

        this.rule = foundry.utils.deepClone(rule);
    }

    /* --- Statics --- */

    public static show(rule: BonusTalentsRule) {
        return new Promise<BonusTalentsRule | null>((resolve) => {
            const dialog = new this(rule, resolve);
            void dialog.render(true);
        });
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: EditBonusTalentsRuleDialog,
        event: Event,
    ) {
        event.preventDefault();
    }

    /* --- Actions --- */

    protected static onSubmit(this: EditBonusTalentsRuleDialog) {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            level: HTMLInputElement;
            quantity: HTMLInputElement;
            restrictions: HTMLInputElement;
        };

        this.rule.level = Number(form.level.value);
        this.rule.quantity = Number(form.quantity.value);
        this.rule.restrictions = form.restrictions.value;

        this.resolve(this.rule);
        this.submitted = true;
        void this.close();
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            ...this.rule,
        });
    }
}
