import { AnyObject } from '@system/types/utils';
import { IMPORTED_RESOURCES, SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dice
import { PlotDie } from '@system/dice/plot-die';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

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
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
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
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ROLL_PICK_DICE_RESULT}`,
            },
        },
    );

    private rolls: foundry.dice.terms.DiceTerm.Result[];
    private submitted = false;

    private constructor(
        private data: PickDiceResultDialog.Data,
        private resolve: (
            results: foundry.dice.terms.DiceTerm.Result[] | null,
        ) => void,
    ) {
        super({});

        // Mark all results as discarded to begin with
        this.rolls = foundry.utils
            .deepClone(this.data.term.results)
            .map((result) => ({
                ...result,
                discarded: true,
            }));
    }

    /* --- Statics --- */

    public static show(data: PickDiceResultDialog.Data) {
        return new Promise<foundry.dice.terms.DiceTerm.Result[] | null>(
            (resolve) => void new this(data, resolve).render(true),
        );
    }

    /* --- Accessors --- */

    get picked() {
        return this.rolls.filter((result) => !result.discarded);
    }

    /* --- Actions --- */

    private static onSelectResult(this: PickDiceResultDialog, event: Event) {
        // Get index
        const index = $(event.target!)
            .closest('[data-index]')
            .data('index') as number;
        if (index === undefined) return;

        // Get selected result
        const result = this.rolls[index];

        // Ensure the amount picked is less than the amount to pick
        if (this.picked.length >= this.data.amount && !!result.discarded) {
            return void ui.notifications.error(
                game.i18n!.format('DIALOG.PickDiceResult.Error.TooManyPicked', {
                    max: this.data.amount,
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
            const match = this.rolls[index];

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

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    protected _prepareContext() {
        const isPlotDie = this.data.term instanceof PlotDie;

        return Promise.resolve({
            isPlotDie,
            die: isPlotDie ? 'd6' : this.data.term.denomination,
            faces: this.data.term.faces ?? 0,
            rolls: this.rolls,
            amountLeft: this.data.amount - this.picked.length,
            plotDie: {
                c2: IMPORTED_RESOURCES.PLOT_DICE_C2_IN_CHAT,
                c4: IMPORTED_RESOURCES.PLOT_DICE_C4_IN_CHAT,
                op: IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT,
            },
        });
    }
}
