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

export interface PlotDieData extends Partial<foundry.dice.terms.Die.TermData> {
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

export class PlotDie extends foundry.dice.terms.Die {
    public readonly isPlotDie = true;

    constructor(data: PlotDieData = {}) {
        super({
            ...data,
            faces: 6,
        });
    }

    static DENOMINATION = 'p';

    /* --- Accessors --- */

    get rolledComplication(): boolean {
        return this.results.find((r) => !r.discarded)?.failure ?? false;
    }

    get rolledOpportunity(): boolean {
        return this.results.find((r) => !r.discarded)?.success ?? false;
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
}
