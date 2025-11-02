import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';

export class CosmereSkillRoll extends CosmereRoll {
    public constructor(
        formula: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(formula, data, options);
    }

    /* --- Accessors --- */
    protected override get type(): RollType {
        return RollType.Skill;
    }

    /* --- Functions --- */
}
