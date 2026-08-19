import { AnyObject } from '@system/types/utils';
import { IMPORTED_RESOURCES, SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';
import { DiceTermResult } from '@src/system/dice';

const { ApplicationV2 } = foundry.applications.api;

export namespace PickDiceResultDialog {
    export interface Data {
        /**
         * The term for which to pick results
         */
        term: foundry.dice.terms.DiceTerm;

        /**
         * The amount of dice to pick
         */
        amount: number;
    }
}

export class PickDiceResultDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            minimizable: false,
            resizable: false,
            title: 'DIALOG.PickDiceResult.Title',
        },
        classes: ['dialog', 'pick-dice-result'],
        tag: 'dialog',
        position: {
            width: 300,
        },
        actions: {
            'select-result': this.onSelectResult,
            submit: this.onSubmit,
        },
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.DIALOG_ROLL_PICK_DICE_RESULT}`,
            },
        },
    );

    private constructor(
        private data: PickDiceResultDialog.Data,
        private resolve: (results: DiceTermResult[] | null) => void,
    ) {
        super({});

        // Mark all results as discarded to begin with
        this.results = foundry.utils
            .deepClone(this.data.term.results)
            .map((result) => ({
                ...result,
                discarded: true,
            }));
    }

    private results: DiceTermResult[];
    private submitted = false;

    /* --- Statics --- */

    public static show(data: PickDiceResultDialog.Data) {
        return new Promise<DiceTermResult[] | null>(
            (resolve) => void new this(data, resolve).render(true),
        );
    }

    /* --- Accessors --- */

    get picked() {
        return this.results.filter((result) => !result.discarded);
    }

    /* --- Actions --- */

    private static onSelectResult(this: PickDiceResultDialog, event: Event) {
        // Get index
        const index = $(event.target!)
            .closest('[data-index]')
            .data('index') as number;
        if (index === undefined) return;

        // Get selected result
        const result = this.results[index];

        // Ensure the amount picked is less than the amount to pick
        if (this.picked.length >= this.data.amount && !!result.discarded) {
            return void ui.notifications.error(
                game.i18n.format('DIALOG.PickDiceResult.Error.TooManyPicked', {
                    max: this.data.amount.toFixed(),
                }),
            );
        }

        // Toggle discarded
        result.discarded = !result.discarded;

        // If only 1 result needs to be selected, submit immediately
        void this.render(true);
    }

    private static onSubmit(this: PickDiceResultDialog) {
        // Apply to term
        this.data.term.results.forEach((result, index) => {
            const match = this.results[index];

            result.discarded = match.discarded;
            result.active = match.discarded ? false : result.active;
        });

        // Set submitted
        this.submitted = true;

        // Resolve
        this.resolve(this.data.term.results);

        // Close
        void this.close();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    public _prepareContext() {
        return Promise.resolve({
            amountLeft: this.data.amount - this.picked.length,
            results: this.results.map((r, idx) => {
                return {
                    result: this.data.term.getResultLabel(r),
                    classes: this.data.term.getResultCSS(r).filterJoin(' '),
                    index: idx,
                };
            }),
        });
    }
}
