export type RollMode = keyof CONFIG.Dice.RollModes;

export const enum RollType {
    Generic = 'generic',
    Skill = 'skill',
    Damage = 'damage',
    Injury = 'injury',
    Plot = 'plot',
}

export const enum DieType {
    Generic = 'generic',
    Plot = 'plot',
}

export const enum DieModifier {
    Advantage = 'kh',
    Disadvantage = 'kl',
    RerollOnce = 'r',
    Reroll = 'rr',
    Minimum = 'min',
    Maximum = 'max',
    Pick = 'p',
    PickGM = 'gmp',
}

export interface DiceTermResult extends foundry.dice.terms.DiceTerm.Result {
    hidden?: boolean;
}

export interface DiceEvaluationOptions
    extends Partial<foundry.dice.terms.DiceTerm.EvaluationOptions> {
    reroll?: boolean;
}

export interface RollEvaluationOptions
    extends Partial<foundry.dice.Roll.Options> {
    reroll?: boolean;
}
