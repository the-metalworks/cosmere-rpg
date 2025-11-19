import { CosmereRoll } from '../rolls/cosmere-roll';
import { DieType, EvaluationOptions } from '../types';
import { CosmereDie } from './cosmere-die';
import { CosmerePlotDie } from './cosmere-die-plot';

export interface CosmereDiceGroupData
    extends Omit<foundry.dice.terms.DiceTerm.TermData, 'number' | 'faces'> {
    /**
     * @defaultValue `1`
     */
    number: number | CosmereRoll;

    /**
     * @defaultValue `6`
     */
    faces: number | CosmereRoll;

    opportunityRange?: number;

    complicationRange?: number;

    parts?: string[];
}

export class CosmereDiceGroup extends foundry.dice.terms.RollTerm {
    public constructor(protected termData: CosmereDiceGroupData) {
        super(termData);

        this.uuid = `cosmere:group:${foundry.utils.randomID()}`;

        this._number = termData.number;
        this._faces = termData.faces;
        this._dice = [];
    }

    static DENOMINATION = 'g';

    public readonly uuid: string;

    private readonly _dice: CosmereDie[];

    private _number: number | CosmereRoll;
    private _faces: number | CosmereRoll;

    /* --- Accessors --- */
    public override get expression(): string {
        return `${this._number as number}d${this._faces as number}`;
    }

    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    public override get isDeterministic(): boolean {
        return false;
    }

    // public override get expression(): string {
    //     switch (this._dice.length)
    //     {
    //         case 0:
    //             return `XdX`;
    //         case 1:
    //             return this._dice[0].formula;
    //         default:
    //         {
    //             const x = this._dice.every(d => d.type === DieType.Regular) ? this._faces : this._dice[0].denomination;

    //             if (this._dice.every(d => d.number === 1 && !(d.modifiers.length > 0)))
    //             {
    //                 return `${this.number}d${x}`;
    //             }

    //             return `{${this._dice.map(d => d.formula).join(",")}}`;
    //         }
    //     }
    // }

    public get dice(): CosmereDie[] {
        return this._dice;
    }

    public get total(): number | undefined {
        return this._evaluated
            ? this._dice.reduce((total, d) => total + (d.total ?? 0), 0)
            : undefined;
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
        if (options?.maximize || options?.minimize || options?.reroll) {
            this._evaluated = false;
        }

        return super.evaluate(options);
    }

    protected override async _evaluate(
        options?: EvaluationOptions,
    ): Promise<this> {
        const number =
            this._number instanceof CosmereRoll
                ? (await this._number.evaluate(options)).total
                : this._number;

        const faces =
            this._faces instanceof CosmereRoll
                ? (await this._faces.evaluate(options)).total
                : this._faces;

        if (this.termData.modifiers?.length > 0) {
            this.pushDie(
                this.termData,
                number,
                faces,
                this.termData
                    .modifiers as (keyof foundry.dice.terms.Die.Modifiers)[],
            );
        } else {
            for (let i = 0; i < number; i++) {
                this.pushDie(this.termData, 1, faces);
            }
        }

        const evals: (CosmereDie | Promise<CosmereDie>)[] = [];
        this._dice.forEach((d) => evals.push(d.evaluate(options)));
        await Promise.all(evals);

        return this;
    }

    public static override fromParseNode(
        node: foundry.dice.types.DiceRollParseNode,
    ): CosmereDiceGroup {
        let denomination = CosmereDiceGroup.DENOMINATION;

        if (node.number === null) node.number = 1;

        const number = (
            node.number as foundry.dice.types.ParentheticalRollParseNode
        ).class
            ? CosmereRoll.fromTerms(
                  CosmereRoll.instantiateAST(
                      node.number as foundry.dice.types.ParentheticalRollParseNode,
                  ),
              )
            : (node.number as number);

        if (typeof node.faces === 'string')
            denomination = node.faces.toLowerCase();
        if (node.faces === null) node.faces = 6;

        const faces = (
            node.faces as foundry.dice.types.ParentheticalRollParseNode
        ).class
            ? CosmereRoll.fromTerms(
                  CosmereRoll.instantiateAST(
                      node.faces as foundry.dice.types.ParentheticalRollParseNode,
                  ),
              )
            : (node.faces as number);

        const modifiers = Array.from(
            (node.modifiers || '').matchAll(
                foundry.dice.terms.Die.MODIFIER_REGEXP,
            ),
        ).map(([m]) => m);
        const data = { ...node, number, faces, modifiers, class: this.name };

        return this.fromData(data) as CosmereDiceGroup;
    }

    private pushDie(
        data: CosmereDiceGroupData,
        number = 1,
        faces = 6,
        modifiers: (keyof foundry.dice.terms.Die.Modifiers)[] = [],
    ) {
        const CosmereDieClass =
            faces.toString() === CosmerePlotDie.DENOMINATION
                ? CosmerePlotDie
                : CosmereDie;

        this._dice.push(
            new CosmereDieClass({
                number,
                faces,
                modifiers,
                opportunityRange: data.opportunityRange,
                complicationRange: data.complicationRange,
                method: data.method,
                results: data.results,
                options: data.options,
            }),
        );
    }
}
