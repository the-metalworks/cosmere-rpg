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

    protected get rollType(): string {
        return RollType.Damage;
    }
}
