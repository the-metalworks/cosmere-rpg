import { CosmereActor } from '../documents';
import {
    getSystemKeybinding,
    getSystemSetting,
    KEYBINDINGS,
    SETTINGS,
    TargetingOptions,
} from '../settings';
import { AdvantageMode } from '../types/roll';
import { NONE } from '../types/utils';

/**
 * Determine if the keys of a requested keybinding are pressed.
 * @param {string} action Keybinding action within the system namespace. Can have multiple keybindings associated.
 * @returns {boolean} True if one of the keybindings for the requested action are triggered, false otherwise.
 */
export function areKeysPressed(action: string): boolean {
    const keybinds = getSystemKeybinding(action);

    if (!keybinds || keybinds.length === 0) {
        return false;
    }

    const activeModifiers = {} as Record<string, boolean>;

    const addModifiers = (key: string) => {
        if (hasKey(KeyboardManager.MODIFIER_CODES, key)) {
            KeyboardManager.MODIFIER_CODES[key].forEach(
                (n: string) =>
                    (activeModifiers[n] = game.keyboard!.downKeys.has(n)),
            );
        }
    };
    addModifiers(KeyboardManager.MODIFIER_KEYS.CONTROL);
    addModifiers(KeyboardManager.MODIFIER_KEYS.SHIFT);
    addModifiers(KeyboardManager.MODIFIER_KEYS.ALT);

    return getSystemKeybinding(action).some((b) => {
        if (
            game.keyboard!.downKeys.has(b.key) &&
            b.modifiers?.every((m) => activeModifiers[m])
        )
            return true;
        if (b.modifiers?.length) return false;
        return activeModifiers[b.key];
    });
}

/**
 * Checks if a given object has the given property key as a key for indexing.
 * Adding this check beforehand allows an object to be indexed by that key directly without typescript errors.
 * @param {T} obj The object to check for indexing.
 * @param {PropertyKey} key The key to check within the object.
 * @returns {boolean} True if the given object has requested property key, false otherwise.
 */
export function hasKey<T extends object>(
    obj: T,
    key: PropertyKey,
): key is keyof T {
    return key in obj;
}

/**
 * Converts entries from input forms that will include human-readable "none" into nulls for easier identification in code.
 */
export function getNullableFromFormInput<T>(formField: string | null) {
    return formField && formField !== NONE ? (formField as T) : null;
}

/**
 * Processes pressed keys and provided config values to determine final values for a roll, specifically:
 * if it should skip the configuration dialog, what advantage mode it is using, and if it has raised stakes.
 * @param {boolean} [configure] Should the roll dialog be skipped?
 * @param {boolean} [advantage] Is something granting this roll advantage?
 * @param {boolean} [disadvantage] Is something granting this roll disadvantage?
 * @param {boolean} [raiseStakes] Is something granting this roll raised stakes?
 * @returns {{fastForward: boolean, advantageMode: AdvantageMode, plotDie: boolean}} Whether a roll should fast forward, have a plot die, and its advantage mode.
 */
export function determineConfigurationMode(
    configure?: boolean,
    advantage?: boolean,
    disadvantage?: boolean,
    raiseStakes?: boolean,
) {
    const modifiers = {
        advantage: areKeysPressed(KEYBINDINGS.SKIP_DIALOG_ADVANTAGE),
        disadvantage: areKeysPressed(KEYBINDINGS.SKIP_DIALOG_DISADVANTAGE),
        raiseStakes: areKeysPressed(KEYBINDINGS.SKIP_DIALOG_RAISE_STAKES),
    };

    const fastForward =
        configure !== undefined
            ? !configure
            : isFastForward() || Object.values(modifiers).some((k) => k);

    const hasAdvantage = advantage ?? modifiers.advantage;
    const hasDisadvantage = disadvantage ?? modifiers.disadvantage;
    const advantageMode = hasAdvantage
        ? AdvantageMode.Advantage
        : hasDisadvantage
          ? AdvantageMode.Disadvantage
          : AdvantageMode.None;
    const plotDie = raiseStakes ?? modifiers.raiseStakes;

    return { fastForward, advantageMode, plotDie };
}

/**
 * Processes pressed keys and selected system settings to determine if a roll should fast forward.
 * This function allows the swappable behaviour of the Skip/Show Dialog modifier key, making it behave correctly depending on the system setting selected by the user.
 * @returns {boolean} Whether a roll should fast forward or not.
 */
export function isFastForward() {
    const skipKeyPressed = areKeysPressed(KEYBINDINGS.SKIP_DIALOG_DEFAULT);
    const skipByDefault = getSystemSetting(SETTINGS.ROLL_SKIP_DIALOG_DEFAULT);

    return (
        (skipByDefault && !skipKeyPressed) || (!skipByDefault && skipKeyPressed)
    );
}

/**
 * Computes the constant value of a roll (i.e. total of numeric terms).
 * @param {Roll} roll The roll to calculate the constant total from.
 * @returns {number} The total constant value.
 */
export function getConstantFromRoll(roll: Roll) {
    let previous: unknown;
    let constant = 0;

    for (const term of roll.terms) {
        if (term instanceof foundry.dice.terms.NumericTerm) {
            if (
                previous instanceof foundry.dice.terms.OperatorTerm &&
                previous.operator === '-'
            ) {
                constant -= term.number;
            } else {
                constant += term.number;
            }
        } else if (term instanceof foundry.dice.terms.FunctionTerm) {
            if (typeof term.total === 'number') {
                constant += term.total;
            }
        }

        previous = term;
    }

    return constant;
}

/**
 * Converts a list of the various parts of a formula into a displayable string.
 *
 * @param {string[]} diceParts A parts array as provided from the foundry Roll API.
 * @returns {string} The human readable display string for the formula (without terms aggregated).
 */
export function getFormulaDisplayString(diceParts: string[]) {
    const joined = diceParts
        .join(' + ')
        .replace(/\+ -/g, '-')
        .replace(/\+ \+/g, '+');
    return joined.endsWith(' + ') || joined.endsWith(' - ')
        ? joined.substring(0, joined.length - 3)
        : joined;
}

/**
 * Gets the current set of tokens that are selected or targeted (or both) depending on the chosen setting.
 * @returns {Set} A set of tokens that the system considers as current targets.
 */
export function getApplyTargets() {
    const setting = getSystemSetting(
        SETTINGS.APPLY_BUTTONS_TO,
    ) as TargetingOptions;

    const applyToTargeted =
        setting === TargetingOptions.TargetedOnly ||
        setting >= TargetingOptions.SelectedAndTargeted;
    const applyToSelected =
        setting === TargetingOptions.SelectedOnly ||
        setting >= TargetingOptions.SelectedAndTargeted;
    const prioritiseTargeted = setting === TargetingOptions.PrioritiseTargeted;
    const prioritiseSelected = setting === TargetingOptions.PrioritiseSelected;

    const selectTokens = applyToSelected
        ? canvas!.tokens!.controlled
        : ([] as Token[]);
    const targetTokens = applyToTargeted ? game.user!.targets : new Set();

    if (prioritiseSelected && selectTokens.length > 0) {
        targetTokens.clear();
    }

    if (prioritiseTargeted && targetTokens.size > 0) {
        selectTokens.length = 0;
    }

    return new Set([...selectTokens, ...targetTokens]);
}

export interface TargetDescriptor {
    /**
     * The UUID of the target.
     */
    uuid: string;

    /**
     * The target's name.
     */
    name: string;

    /**
     * The target's image.
     */
    img: string;

    /**
     * The target's defense values.
     */
    def: {
        phy: number;
        cog: number;
        spi: number;
    };
}

/**
 * Grab the targeted tokens and return relevant information on them.
 * @returns {TargetDescriptor[]}
 */
export function getTargetDescriptors() {
    const targets = new Map();
    for (const token of game.user!.targets) {
        const { name, img, system, uuid } = (token.actor as CosmereActor) ?? {};
        const phy = system.defenses.phy.value.value ?? 10;
        const cog = system.defenses.cog.value.value ?? 10;
        const spi = system.defenses.spi.value.value ?? 10;

        if (uuid) {
            targets.set(uuid, { name, img, uuid, def: { phy, cog, spi } });
        }
    }

    return Array.from(targets.values());
}
