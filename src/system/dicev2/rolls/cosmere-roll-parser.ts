export class CosmereRollParser extends foundry.dice.RollParser {
    public override _onDiceTerm(
        number:
            | foundry.dice.types.NumericRollParseNode
            | foundry.dice.types.ParentheticalRollParseNode
            | null,
        faces:
            | string
            | foundry.dice.types.NumericRollParseNode
            | foundry.dice.types.ParentheticalRollParseNode
            | null,
        modifiers: string | null,
        flavor: string | null,
        formula: string,
    ): foundry.dice.types.DiceRollParseNode {
        return super._onDiceTerm(number, faces, modifiers, flavor, formula);
    }

    public override _onPoolTerm(
        head: foundry.dice.types.RollParseNode,
        tail: foundry.dice.types.RollParseNode[],
        modifiers: string | null,
        flavor: string | null,
        formula: string,
    ): foundry.dice.types.PoolRollParseNode {
        return super._onPoolTerm(head, tail, modifiers, flavor, formula);
    }
}
