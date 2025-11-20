import {
    DiceTermResult,
    DiceEvaluationOptions,
    DieType,
    DieModifier,
} from '../types';

export interface CosmereDieData extends foundry.dice.terms.Die.TermData {
    opportunityRange?: number;

    complicationRange?: number;
}

export class CosmereDie extends foundry.dice.terms.Die {
    public constructor(protected termData: CosmereDieData) {
        super(termData);

        this.uuid = `cosmere:die:${this.type}:${foundry.utils.randomID()}`;

        this.number = termData.number ?? 1;
        this.opportunityRange = termData.opportunityRange ?? termData.faces;
        this.complicationRange = termData.complicationRange ?? 1;
    }

    public readonly uuid: string;

    public opportunityRange: number;
    public complicationRange: number;

    public override results: DiceTermResult[] = [];

    /* --- Accessors --- */
    protected get type(): DieType {
        return DieType.Generic;
    }

    public override get dice(): CosmereDie[] {
        return []; // Block this getter since CosmereDie should only ever contain 1 die.
    }

    public override get values(): number[] {
        return []; // Block this getter since CosmereDie should only ever have 1 value, accessed as total.
    }

    public get evaluated(): boolean {
        return this._evaluated;
    }

    public get hasAdvantage(): boolean {
        return this.modifiers.includes(DieModifier.Advantage);
    }

    public get hasDisadvantage(): boolean {
        return this.modifiers.includes(DieModifier.Disadvantage);
    }

    public get hasOpportunity(): boolean {
        return this.total !== undefined && this.total >= this.opportunityRange;
    }

    public get hasComplication(): boolean {
        return this.total !== undefined && this.total <= this.complicationRange;
    }

    /* --- Functions --- */
    public override evaluate(
        options?: DiceEvaluationOptions,
    ): this | Promise<this> {
        if (options?.maximize || options?.minimize || options?.reroll) {
            this.results = [];
            this._evaluated = false;
        }

        return super.evaluate(options);
    }

    public modify(modifier: DieModifier): this | Promise<this> {
        switch (modifier) {
            case DieModifier.Advantage:
            case DieModifier.Disadvantage:
                if (
                    this.modifiers.includes(DieModifier.Advantage) ||
                    this.modifiers.includes(DieModifier.Disadvantage)
                ) {
                    throw new Error(
                        `The ${this.constructor.name} already has ${modifier === DieModifier.Advantage ? 'advantage' : 'disadvantage'}`,
                    );
                }

                this.number = 2;
                break;
            default:
                if (this.modifiers.includes(modifier)) {
                    throw new Error(
                        `The ${this.constructor.name} already has modifier ${modifier}`,
                    );
                }
                break;
        }

        this.modifiers.push(modifier);
        this._evaluated = false;

        return this.evaluate();
    }
}
