import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';

export class CosmereInjuryRoll extends CosmereRoll {
    public constructor(
        protected parts: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(parts, data, options);
    }

    /* --- Accessors --- */
    protected override get type(): RollType {
        return RollType.Injury;
    }

    private readonly _hasAdvantage = false;
    public override get hasAdvantage() {
        return this._hasAdvantage;
    }

    private readonly _hasDisadvantage = false;
    public override get hasDisadvantage() {
        return this._hasDisadvantage;
    }

    private readonly _hasOpportunity = false;
    public override get hasOpportunity() {
        return this._hasOpportunity;
    }

    private readonly _hasComplication = false;
    public override get hasComplication() {
        return this._hasComplication;
    }

    /* --- Functions --- */
}
