/* eslint-disable @typescript-eslint/class-literal-property-style */
import { DieType } from '../types';

export interface CosmereDieData
    extends Omit<foundry.dice.terms.Die.TermData, 'number'> {
    opportunityRange?: number;

    complicationRange?: number;
}

export class CosmereDie extends foundry.dice.terms.Die {
    public constructor(protected termData: CosmereDieData) {
        super(termData);

        this.uuid = `cosmere:die:${this.dieType}:${foundry.utils.randomID()}`;

        this.opportunityRange = termData.opportunityRange ?? termData.faces;
        this.complicationRange = termData.complicationRange ?? 1;
    }

    public readonly uuid: string;

    public opportunityRange: number;
    public complicationRange: number;

    /* --- Accessors --- */
    protected get dieType(): string {
        return DieType.Generic;
    }

    public get hasAdvantage(): boolean {
        return false;
    }

    public get hasDisadvantage(): boolean {
        return false;
    }

    public get hasOpportunity(): boolean {
        return this.total !== undefined && this.total >= this.opportunityRange;
    }

    public get hasComplication(): boolean {
        return this.total !== undefined && this.total <= this.complicationRange;
    }

    /* --- Functions --- */
}
