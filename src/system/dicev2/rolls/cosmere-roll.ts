/* eslint-disable @typescript-eslint/class-literal-property-style */

import { CosmereActor, CosmereItem } from '@src/system/documents';
import { RollMode, RollType } from '../types';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CosmereRollData = {
    source: CosmereItem | CosmereActor | null;

    context: string;
};

export interface CosmereRollOptions extends Partial<foundry.dice.Roll.Options> {
    rollMode?: RollMode;
}

export abstract class CosmereRoll extends foundry.dice.Roll<CosmereRollData> {
    public constructor(
        protected parts: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(parts, data, options);

        this.uuid = `cosmere:roll:${this.rollType}:${foundry.utils.randomID()}`;
    }

    public readonly uuid: string;

    protected get rollType(): string {
        return RollType.Generic;
    }

    public get hasAdvantage(): boolean {
        return false;
    }

    public get hasDisadvantage(): boolean {
        return false;
    }

    public get hasOpportunity(): boolean {
        return false;
    }

    public get hasComplication(): boolean {
        return false;
    }
}
