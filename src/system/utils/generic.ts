import { CosmereActor } from '@system/documents/actor';
import { CosmereItem } from '@system/documents/item';
import {
    getSystemKeybinding,
    getSystemSetting,
    KEYBINDINGS,
    SETTINGS,
    TargetingOptions,
} from '../settings';
import { AdvantageMode } from '../types/roll';
import { NONE } from '../types/utils';

const HTML_TAG_REGEX = /<[^>]+>/g;

/**
 * Checks if a given HTML string has any content or is just whitespace.
 * @param htmlString The HTML string to check.
 * @returns True if the HTML string has content, false otherwise.
 */
export function htmlStringHasContent(htmlString: string | undefined): boolean {
    // If the string is undefined or null, return false
    if (!htmlString) return false;

    // Remove HTML tags and trim whitespace
    const content = htmlString.replace(HTML_TAG_REGEX, '').trim();
    // Check if the content is not empty
    return content.length > 0;
}

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

export interface ConfigurationMode {
    fastForward: boolean;
    advantageMode: AdvantageMode;
    plotDie: boolean;
}

/**
 * Processes pressed keys and provided config values to determine final values for a roll, specifically:
 * if it should skip the configuration dialog, what advantage mode it is using, and if it has raised stakes.
 * @param configure Should the roll dialog be skipped?
 * @param advantage Is something granting this roll advantage?
 * @param disadvantage Is something granting this roll disadvantage?
 * @param raiseStakes Is something granting this roll raised stakes?
 * @returns Whether a roll should fast forward, have a plot die, and its advantage mode.
 */
export function determineConfigurationMode(
    useOptions?: CosmereItem.UseOptions,
): ConfigurationMode;
export function determineConfigurationMode(
    configure?: boolean,
    advantage?: boolean,
    disadvantage?: boolean,
    raiseStakes?: boolean,
): ConfigurationMode;
export function determineConfigurationMode(
    ...args:
        | [CosmereItem.UseOptions?]
        | [boolean?, boolean?, boolean?, boolean?]
): ConfigurationMode {
    const useOptions =
        args.length === 1
            ? (args[0] as CosmereItem.UseOptions | undefined)
            : undefined;

    const [configure, advantage, disadvantage, raiseStakes] =
        args.length === 1
            ? [
                  useOptions?.configurable,
                  useOptions?.advantageMode !== undefined
                      ? useOptions.advantageMode === AdvantageMode.Advantage
                      : undefined,
                  useOptions?.advantageMode !== undefined
                      ? useOptions.advantageMode === AdvantageMode.Disadvantage
                      : undefined,
                  useOptions?.plotDie,
              ]
            : args;

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
    const skipByDefault = getSystemSetting(SETTINGS.DIALOG_ROLL_SKIP_DEFAULT);

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
 * Toggles a given Advantage Mode to the correct advantage mode given the corresponding click used.
 * @param {AdvantageMode} current The current Advantage Mode to cycle from.
 * @param {boolean} leftClick Was the click a left click or a right click.
 * @returns {AdvantageMode} The resulting cycled Advantage Mode.
 */
export function toggleAdvantageMode(
    current: AdvantageMode,
    leftClick: boolean,
) {
    switch (current) {
        case AdvantageMode.None:
            return leftClick
                ? AdvantageMode.Advantage
                : AdvantageMode.Disadvantage;
        case AdvantageMode.Advantage:
            return leftClick ? AdvantageMode.None : AdvantageMode.Disadvantage;
        case AdvantageMode.Disadvantage:
            return leftClick ? AdvantageMode.Advantage : AdvantageMode.None;
    }
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
    const setting = getSystemSetting<TargetingOptions>(
        SETTINGS.APPLY_BUTTONS_TO,
    );

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
    const targets = new Map<string, TargetDescriptor>();
    for (const token of game.user!.targets) {
        const { name, img, system, uuid } = (token.actor as CosmereActor) ?? {};
        const phy = system?.defenses.phy.value ?? 10;
        const cog = system?.defenses.cog.value ?? 10;
        const spi = system?.defenses.spi.value ?? 10;

        if (uuid) {
            targets.set(uuid, { name, img, uuid, def: { phy, cog, spi } });
        }
    }

    return Array.from(targets.values());
}

/**
 * Wrap callbacks in debounce mechanism.
 * Prevents multiple invocations of the same callback within a given delay.
 * If the `immediate` flag is set, the callback will be invoked immediately on the first call and then debounced for subsequent calls.
 * Otherwise, it will wait for the delay before invoking the callback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number,
    immediate = false,
): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>): void {
        const later = () => {
            timeoutId = null;
            if (!immediate) callback.apply(this, args);
        };

        const callNow = immediate && !timeoutId;
        clearTimeout(timeoutId!);
        timeoutId = setTimeout(later, delay);

        if (callNow) callback.apply(this, args);
    } as T;
}
