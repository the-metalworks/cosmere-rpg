import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';

export class CosmereDamageRoll extends CosmereRoll {
    public constructor(
        protected parts: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(parts, data, options);
    }

    protected override get rollType(): string {
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
}
