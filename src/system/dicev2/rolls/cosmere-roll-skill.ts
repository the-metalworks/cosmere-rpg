import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';

export class CosmereSkillRoll extends CosmereRoll {
    public constructor(
        protected parts: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(parts, data, options);
    }

    /* --- Accessors --- */
    protected override get type(): string {
        return RollType.Skill;
    }

    /* --- Functions --- */
}
