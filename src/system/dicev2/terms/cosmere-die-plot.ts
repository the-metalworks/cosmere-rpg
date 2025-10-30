import { IMPORTED_RESOURCES } from '@src/system/constants';
import { DieType } from '../types';
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

    /* --- Accessors --- */
    protected override get type(): DieType {
        return DieType.Plot;
    }

    /* --- Functions --- */
    override getResultLabel(
        result: foundry.dice.terms.DiceTerm.Result,
    ): string {
        return CosmerePlotDie.SIDES[result.result];
    }
}
