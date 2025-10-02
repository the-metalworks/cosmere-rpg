/**
 * NOTE: Define own localization helpers because using 
 * game.i18n directly from data schema definition causes circular
 * type references.
 */

export function localize(stringId: string): string {
    return game.i18n.localize(stringId);
}

export function format(stringId: string, data?: Record<string, string>): string {
    return game.i18n.format(stringId, data);
}