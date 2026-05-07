import { FixedInstanceType } from '@league-of-foundry-developers/foundry-vtt-types/utils';
import {
    DiceTermResult,
    DiceEvaluationOptions,
    DieType,
    DieModifier,
} from '../types';

import { PickDiceResultDialog } from '@system/applications/dialogs/pick-dice-result';

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

    static override MODIFIERS = {
        ...super.MODIFIERS,
        p: 'pick',
        gmp: 'pick',
    };

    static SERIALIZE_ATTRIBUTES = [
        ...super.SERIALIZE_ATTRIBUTES,
        'uuid',
        'opportunityRange',
        'complicationRange',
    ];

    public uuid: string;

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
        return (
            this.evaluated &&
            this.results.some(
                (r) => r.active && r.result >= this.opportunityRange,
            )
        );
    }

    public get hasComplication(): boolean {
        return (
            this.evaluated &&
            this.results.some(
                (r) => r.active && r.result <= this.complicationRange,
            )
        );
    }

    public hasModifier(modifier: DieModifier): boolean {
        return this.modifiers.includes(modifier);
    }

    public hasTwoDiceModifier(): boolean {
        return (
            this.modifiers.includes(DieModifier.Advantage) ||
            this.modifiers.includes(DieModifier.Disadvantage) ||
            this.modifiers.includes(DieModifier.Pick) ||
            this.modifiers.includes(DieModifier.PickGM)
        );
    }

    /* --- Functions --- */
    protected static override _fromData<
        T extends foundry.dice.terms.RollTerm.AnyConstructor,
    >(this: T, data: Record<string, unknown>): FixedInstanceType<T> {
        const term = super._fromData(data) as CosmereDie;

        term.uuid = (data.uuid as string) ?? term.uuid;
        term.opportunityRange =
            (data.opportunityRange as number) ?? term.opportunityRange;
        term.complicationRange =
            (data.complicationRange as number) ?? term.complicationRange;
        term.results = (data.results as DiceTermResult[]) ?? term.results;

        return term as FixedInstanceType<T>;
    }

    public override evaluate(
        options?: DiceEvaluationOptions,
    ): this | Promise<this> {
        if (options?.maximize || options?.minimize || options?.reroll) {
            this.results = [];
            this._evaluated = false;
        }

        return super.evaluate(options);
    }

    public override getResultCSS(result: DiceTermResult): (string | null)[] {
        return [
            `d${this.faces}`,
            result.rerolled ? 'rerolled' : null,
            result.discarded ? 'discarded' : null,
            result.exploded ? 'exploded' : null,
            result.result >= this.opportunityRange ? 'success' : null,
            result.result <= this.complicationRange ? 'failure' : null,
        ];
    }

    public setResult(result: number): this {
        if (result < 1 || result > (this.faces ?? 1)) {
            throw new Error(
                `The given result ${result} is outside the possible result range of the ${this.constructor.name} (1 to ${this.faces})`,
            );
        }

        this.results.forEach((r) => {
            if (r.active ?? false) {
                r.result = result;
            }
        });

        return this;
    }

    public modify(modifier: DieModifier): this | Promise<this> {
        if (this.modifiers.includes(modifier)) {
            throw new Error(
                `The ${this.constructor.name} already has modifier ${modifier}`,
            );
        }

        switch (modifier) {
            case DieModifier.Advantage:
            case DieModifier.Disadvantage:
            case DieModifier.Pick:
            case DieModifier.PickGM:
                this.number = 2;
                break;
            default:
                break;
        }

        this.modifiers.push(modifier);

        if (this._evaluated) {
            this._evaluated = false;
            return this.evaluate();
        }

        return this;
    }

    public unmodify(modifier: DieModifier): this | Promise<this> {
        if (!this.modifiers.includes(modifier)) {
            throw new Error(
                `The ${this.constructor.name} does not have modifier ${modifier}`,
            );
        }

        switch (modifier) {
            case DieModifier.Advantage:
            case DieModifier.Disadvantage:
            case DieModifier.Pick:
            case DieModifier.PickGM:
                this.number = 1;

                this.results = this._evaluated ? [this.results[0]] : [];
                this.results = this.results.map((result) => ({
                    ...result,
                    discarded: false,
                    active: true,
                }));
                break;
            default:
                break;
        }

        this.modifiers = this.modifiers.filter((m) => m !== modifier);

        if (this._evaluated) {
            this._evaluated = false;
            return this.evaluate();
        }

        return this;
    }

    public async pick(modifier: string) {
        const rgx = /(gm)?p([0-9]+)?/i;
        const match = rgx.exec(modifier);

        if (!match) return false;

        const [gm, number] = match.slice(1);
        const isGm = !!gm;
        const amount = Math.min(parseInt(number) || 1, this.number ?? 0);

        // Show dialog
        const result = await PickDiceResultDialog.show({ term: this, amount });

        if (result === null) {
            this.number = 1;
            this.results = [this.results[0]];
            return false;
        }
    }
}
