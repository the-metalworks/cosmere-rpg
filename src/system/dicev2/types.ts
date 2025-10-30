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
