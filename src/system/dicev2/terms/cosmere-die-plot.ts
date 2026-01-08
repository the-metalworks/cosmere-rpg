import { IMPORTED_RESOURCES } from '@src/system/constants';
import { DiceTermResult, DieModifier, DieType } from '../types';
import { CosmereDie, CosmereDieData } from './cosmere-die';

export class CosmerePlotDie extends CosmereDie {
    public constructor(protected termData: CosmereDieData) {
        super({
            ...termData,
            opportunityRange: 5,
            complicationRange: 2,
            faces: 6,
        });
    }

    static DENOMINATION = 'p';

    static SIDES: Record<number, string> = {
        1: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_C2_IN_CHAT}" />`,
        2: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_C4_IN_CHAT}" />`,
        3: '&nbsp;',
        4: '&nbsp;',
        5: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT}" />`,
        6: `<img src="${IMPORTED_RESOURCES.PLOT_DICE_OP_IN_CHAT}" />`,
    };

    static BONUS: Record<number, number> = {
        1: 2,
        2: 4,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
    };

    // For plot dice, we override the default adv/disadv behaviour to always use pick
    // Have to do this weird cast due to typing constraints in the fvtt types module
    static override MODIFIERS = {
        ...super.MODIFIERS,
        k: 'pick' as 'keep',
        kh: 'pick' as 'keep',
        kl: 'pick' as 'keep',
    };

    /* --- Accessors --- */
    protected override get type(): DieType {
        return DieType.Plot;
    }

    public override get denomination(): string {
        return CosmerePlotDie.DENOMINATION;
    }

    public override get total(): number | undefined {
        if (!this._evaluated) return undefined;

        return this.results.reduce((t, r) => {
            if (!r.active) return t;
            return t + CosmerePlotDie.BONUS[r.result];
        }, 0);
    }

    /* --- Functions --- */
    public override getResultLabel(result: DiceTermResult): string {
        return CosmerePlotDie.SIDES[result.result];
    }

    public override async pick(modifier: string) {
        // When the pick call is from a "keep" (i.e. adv/disadv), we properly generate the pick modifier
        const rgx = /k([hl])?([0-9]+)?/i;
        const match = rgx.exec(modifier);

        if (match) {
            const [direction, number] = match.slice(1);
            const isGm = !direction || direction.toLowerCase() === 'h';
            const amount = parseInt(number) || 1;

            modifier = `${isGm ? DieModifier.PickGM : DieModifier.Pick}${amount}`;
        }

        return super.pick(modifier);
    }
}
