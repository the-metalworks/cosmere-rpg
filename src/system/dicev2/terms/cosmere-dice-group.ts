/* eslint-disable @typescript-eslint/class-literal-property-style */

import { EvaluationOptions } from '../types';
import { CosmereDie } from './cosmere-die';

export interface CosmereDiceGroupData
    extends foundry.dice.terms.DiceTerm.TermData {
    opportunityRange?: number;

    complicationRange?: number;

    terms?: string[];
}

export class CosmereDiceGroup extends foundry.dice.terms.RollTerm {
    public constructor(protected termData: CosmereDiceGroupData) {
        super(termData);

        this.uuid = `cosmere:group:${foundry.utils.randomID()}`;
        this._dice = [];
    }

    public readonly uuid: string;

    private readonly _dice: CosmereDie[];

    /* --- Accessors --- */
    public override get expression(): string {
        return '';
    }

    public get dice(): CosmereDie[] {
        return this._dice;
    }

    public get hasAdvantage(): boolean {
        return this._dice.some((d) => d.hasAdvantage);
    }

    public get hasDisadvantage(): boolean {
        return this._dice.some((d) => d.hasDisadvantage);
    }

    public get hasOpportunity(): boolean {
        return this._dice.some((d) => d.hasOpportunity);
    }

    public get hasComplication(): boolean {
        return this._dice.some((d) => d.hasComplication);
    }

    public get opportunityCount(): number {
        return this._dice.filter((d) => d.hasOpportunity).length;
    }

    public get complicationCount(): number {
        return this._dice.filter((d) => d.hasComplication).length;
    }

    /* --- Functions --- */
    public override evaluate(
        options?: EvaluationOptions,
    ): this | Promise<this> {
        this._dice.forEach((d) => d.evaluate(options));
        return this;
    }

    private parse(terms?: string | string[]): CosmereDie[] {
        if (!terms) return [];

        const termsArray = Array.isArray(terms) ? terms : [terms];

        const diceGroup = [];

        for (const term of termsArray) {
            const match = term.match(foundry.dice.terms.Die.REGEXP);

            if (!match) continue;

            const [formula, number, faces, modifier, flavor] = match;
        }

        return [];
    }
}
