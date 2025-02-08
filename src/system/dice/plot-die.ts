// Dialogs
import { PickDiceResultDialog } from '@system/applications/dialogs/pick-dice-result';

// Constants
import { IMPORTED_RESOURCES } from '@system/constants';

const SIDES: Record<number, string> = {
    1: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_C2_IN_CHAT}" />`,
    2: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_C4_IN_CHAT}" />`,
    3: '&nbsp;',
    4: '&nbsp;',
    5: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT}" />`,
    6: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT}" />`,
};

const PICK_MODIFIER_REGEX = /(gm)?p(\d+)?/i;

export interface PlotDieData
    extends Partial<foundry.dice.terms.DiceTerm.TermData> {
    /**
     * The number of dice of this term to roll
     * @default 1
     */
    number?: number;

    /**
     * An optional array of pre-cast results for the term
     */
    results?: foundry.dice.terms.DiceTerm.Result[];
}

export class PlotDie extends foundry.dice.terms.DiceTerm {
    public readonly isPlotDie = true;

    constructor(data: PlotDieData = {}) {
        super({
            ...data,
            faces: 6,
        });
    }

    static DENOMINATION = 'p';

    static MODIFIERS = {
        r: foundry.dice.terms.Die.prototype.reroll.bind(this),
        rr: foundry.dice.terms.Die.prototype.rerollRecursive.bind(this),
        k: foundry.dice.terms.Die.prototype.keep.bind(this),
        kh: foundry.dice.terms.Die.prototype.keep.bind(this),
        kl: foundry.dice.terms.Die.prototype.keep.bind(this),
        d: foundry.dice.terms.Die.prototype.drop.bind(this),
        dh: foundry.dice.terms.Die.prototype.drop.bind(this),
        dl: foundry.dice.terms.Die.prototype.drop.bind(this),
        p: 'pick',
        gmp: 'pick',
    };

    /* --- Accessors --- */

    get rolledComplication(): boolean {
        return this.results[0]?.failure ?? false;
    }

    get rolledOpportunity(): boolean {
        return this.results[0]?.success ?? false;
    }

    /* --- Functions --- */

    async roll({ minimize = false, maximize = false, ...options } = {}) {
        const roll = {
            result: undefined,
            active: true,
        } as Partial<foundry.dice.terms.DiceTerm.Result>;
        if (minimize) roll.result = 1;
        else if (maximize) roll.result = 6;
        else roll.result = await this._roll(options);

        if (roll.result === undefined) roll.result = this.randomFace();
        if (roll.result <= 2) {
            roll.failure = true;
            roll.count = roll.result * 2;
        } else {
            if (roll.result >= 5) roll.success = true;
            roll.count = 0;
        }

        const rollResult = roll as foundry.dice.terms.DiceTerm.Result;
        this.results.push(rollResult);
        return rollResult;
    }

    override getResultLabel(
        result: foundry.dice.terms.DiceTerm.Result,
    ): string {
        return SIDES[result.result];
    }

    /* --- Modifiers --- */

    /**
     * Shows a pop-up that allows the user to pick the result
     */
    async pick(modifier: string) {
        const rgx = new RegExp(PICK_MODIFIER_REGEX);
        const match = rgx.exec(modifier);
        if (!match) return false;

        const [gm, numStr] = match.slice(1);
        const isGm = !!gm; // NOTE: Unused at this time
        const amount = Math.min(parseInt(numStr) || 1, this.number ?? 0);

        // Show dialog
        await PickDiceResultDialog.show({
            term: this,
            amount,
        });
    }
}
