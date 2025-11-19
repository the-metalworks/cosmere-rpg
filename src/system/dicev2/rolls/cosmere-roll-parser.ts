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
    ): foundry.dice.types.DiceRollParseNode & { evaluated: boolean } {
        if (CONFIG.debug.rollParsing) {
            console.debug(
                foundry.dice.RollParser.formatDebug(
                    'onDiceTerm',
                    number,
                    faces,
                    modifiers,
                    flavor,
                    formula,
                ),
            );
        }

        return {
            class: 'CosmereDiceGroup',
            formula,
            modifiers: modifiers!,
            number: number! as
                | number
                | foundry.dice.types.ParentheticalRollParseNode,
            faces: faces! as
                | string
                | number
                | foundry.dice.types.ParentheticalRollParseNode,
            evaluated: false,
            options: { flavour: flavor! },
        };
    }
}
