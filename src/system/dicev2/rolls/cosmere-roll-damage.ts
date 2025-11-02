import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';

export class CosmereDamageRoll extends CosmereRoll {
    public constructor(
        formula: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(formula, data, options);
    }

    /* --- Accessors --- */
    protected override get type(): RollType {
        return RollType.Damage;
    }

    private readonly _hasOpportunity = false;
    public get hasOpportunity() {
        return this._hasOpportunity;
    }

    private readonly _hasComplication = false;
    public get hasComplication() {
        return this._hasComplication;
    }

    /* --- Functions --- */
}
