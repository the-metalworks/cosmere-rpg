import { CosmereActor, CosmereItem } from '@src/system/documents';
import { RollMode, RollType } from '../types';
import { CosmereDiceGroup } from '../terms/cosmere-dice-group';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CosmereRollData = {
    parent?: string;

    source: CosmereItem | CosmereActor | null;

    context: string;
};

export interface CosmereRollOptions extends Partial<foundry.dice.Roll.Options> {
    rollMode?: RollMode;
}

export abstract class CosmereRoll extends foundry.dice.Roll<CosmereRollData> {
    public constructor(
        formula: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(formula, data, options);

        this.parent = data?.parent;
        this.uuid = `cosmere:roll:${this.type}:${foundry.utils.randomID()}`;
    }

    public readonly uuid: string;
    public readonly parent?: string;

    /* --- Accessors --- */
    protected get type(): RollType {
        return RollType.Generic;
    }

    public get hasAdvantage(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasAdvantage,
        );
    }

    public get hasDisadvantage(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasDisadvantage,
        );
    }

    public get hasOpportunity(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasOpportunity,
        );
    }

    public get hasComplication(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasComplication,
        );
    }

    public get opportunityCount(): number {
        return this.terms
            .filter((t) => t instanceof CosmereDiceGroup && t.hasOpportunity)
            .reduce(
                (total, t) =>
                    total + ((t as CosmereDiceGroup).opportunityCount ?? 0),
                0,
            );
    }

    public get complicationCount(): number {
        return this.terms
            .filter((t) => t instanceof CosmereDiceGroup && t.hasComplication)
            .reduce(
                (total, t) =>
                    total + ((t as CosmereDiceGroup).complicationCount ?? 0),
                0,
            );
    }

    /* --- Functions --- */
    public static override instantiateAST(
        ast: foundry.dice.types.RollParseNode,
    ): foundry.dice.terms.RollTerm[] {
        return CONFIG.Dice.parser.flattenTree(ast).map((node) => {
            const cls =
                CONFIG.Dice.termTypes[node.class] ??
                foundry.dice.terms.RollTerm;
            return cls.fromParseNode(node);
        });
    }
}
