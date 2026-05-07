import { FixedInstanceType } from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { CosmereRoll } from '../rolls/cosmere-roll';
import { DiceEvaluationOptions } from '../types';
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

        this._dice = [];
        this._number = termData.number;
        this._faces = termData.faces;
        this._prepared = false;
    }

    static DENOMINATION = 'g';

    static SERIALIZE_ATTRIBUTES = [
        'uuid',
        '_dice',
        '_number',
        '_faces',
        '_prepared',
    ];

    public uuid: string;

    private _dice: CosmereDie[];
    private _number: number | CosmereRoll;
    private _faces: number | CosmereRoll;
    private _prepared: boolean;

    /* --- Accessors --- */
    public override get expression(): string {
        if (
            this._prepared &&
            this._dice.length > 0 &&
            this._dice.some(
                (d) => (d.number ?? 0) > 1 || d.modifiers.length > 0,
            )
        ) {
            return this._dice.length > 1
                ? `{${this._dice.map((d) => d.formula).join(',')}}`
                : `${this._dice[0].formula}`;
        }

        return `${this._number as number}d${this._faces as number}`;
    }

    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    public override get isDeterministic(): boolean {
        return false;
    }

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
    public static override fromParseNode(
        node: foundry.dice.types.DiceRollParseNode,
    ): CosmereDiceGroup {
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

    protected static override _fromData<
        T extends foundry.dice.terms.RollTerm.AnyConstructor,
    >(this: T, data: Record<string, unknown>): FixedInstanceType<T> {
        const term = super._fromData(data) as CosmereDiceGroup;

        term.uuid = (data.uuid as string) ?? term.uuid;
        term._number = (data._number as number | CosmereRoll) ?? term._number;
        term._faces = (data._faces as number | CosmereRoll) ?? term._faces;
        term._prepared = (data._prepared as boolean) ?? term._prepared;

        if (data._dice) {
            term._dice = (data._dice as Record<string, unknown>[]).map((d) =>
                CosmereDie.fromData(d),
            ) as CosmereDie[];
        }

        return term as FixedInstanceType<T>;
    }

    public override evaluate(
        options?: DiceEvaluationOptions,
    ): this | Promise<this> {
        if (options?.maximize || options?.minimize || options?.reroll) {
            this._evaluated = false;
        }

        return super.evaluate(options);
    }

    public async prepare(options?: DiceEvaluationOptions): Promise<this> {
        this._dice = [];

        const number =
            this._number instanceof CosmereRoll
                ? (await this._number.evaluate(options ?? {})).total
                : this._number;

        const faces =
            this._faces instanceof CosmereRoll
                ? (await this._faces.evaluate(options ?? {})).total
                : this._faces;

        if (this.termData.modifiers?.length > 0) {
            this._pushDie(
                this.termData,
                number,
                faces,
                this.termData
                    .modifiers as (keyof foundry.dice.terms.Die.Modifiers)[],
            );
        } else {
            for (let i = 0; i < number; i++) {
                this._pushDie(this.termData, 1, faces);
            }
        }

        this._prepared = true;
        this._evaluated = false;

        return this;
    }

    protected override async _evaluate(
        options?: DiceEvaluationOptions,
    ): Promise<this> {
        const evals: (CosmereDie | Promise<CosmereDie>)[] = [];
        this._dice.forEach((d) => evals.push(d.evaluate(options)));
        await Promise.all(evals);

        return this;
    }

    private _pushDie(
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
