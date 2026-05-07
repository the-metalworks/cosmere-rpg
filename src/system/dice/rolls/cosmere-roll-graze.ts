import { RollType } from '../types';
import {
    CosmereDamageRoll,
    CosmereDamageRollData,
    CosmereDamageRollOptions,
} from './cosmere-roll-damage';

export class CosmereGrazeRoll extends CosmereDamageRoll {
    public constructor(
        formula: string,
        data: CosmereDamageRollData,
        options: CosmereDamageRollOptions = {},
    ) {
        super(formula, data, options);
    }

    /* --- Accessors --- */
    public override get type(): RollType {
        return RollType.Graze;
    }
}
