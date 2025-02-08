import { AnyObject } from '@system/types/utils';

// Dice
import { PlotDie } from '@system/dice/plot-die';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

const { ApplicationV2 } = foundry.applications.api;

// Constants
import { IMPORTED_RESOURCES } from '@system/constants';

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
                resizable: true,
                title: 'DIALOG.PickDiceResult.Title',
            },
            classes: ['dialog', 'pick-dice-result'],
            tag: 'dialog',
            position: {
                width: 400,
            },
            actions: {
                'select-result': this.onSelectResult,
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/roll/dialogs/pick-dice-result.hbs',
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
        return this.data.term.results.filter((result) => !result.discarded);
    }

    /* --- Actions --- */

    private static onSelectResult(this: PickDiceResultDialog, event: Event) {
        console.log('ON SELECT RESULT', event);

        // Get index
        const index = $(event.target!)
            .closest('[data-index]')
            .data('index') as number;
        if (index === undefined) return;

        // Get selected result
        const result = this.rolls[index];

        // Toggle discarded
        result.discarded = !result.discarded;

        // If only 1 result needs to be selected, submit immediately
        if (!result.discarded && this.data.amount === 1) {
            PickDiceResultDialog.onSubmit.call(this);
        }
    }

    private static onSubmit(this: PickDiceResultDialog) {
        // Show warning if the amount picked was less than the amount to pick
        if (this.picked.length < this.data.amount) {
            ui.notifications.warn(
                game.i18n!.format(
                    'DIALOG.PickDiceResult.Warning.PickedLessThanTotal',
                    {
                        picked: this.picked.length,
                        total: this.data.amount,
                    },
                ),
            );
        }

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
            amountToPick: this.data.amount,
            amountPicked: this.picked.length,
            headerText:
                this.data.amount > 1
                    ? game.i18n!.format('DIALOG.PickDiceResult.Header.Plural', {
                          num: this.data.amount,
                      })
                    : game.i18n!.localize(
                          'DIALOG.PickDiceResult.Header.Singular',
                      ),
            plotDie: {
                c2: IMPORTED_RESOURCES.PLOT_DICE_C2_IN_CHAT,
                c4: IMPORTED_RESOURCES.PLOT_DICE_C4_IN_CHAT,
                op: IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT,
            },
        });
    }
}
