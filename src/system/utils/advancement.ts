import {
    AdvancementRuleConfig,
    AdvancementRuleOverride,
} from '@system/types/config';

import { CosmereItem } from '@system/documents/item';
import { CharacterActor } from '@system/documents/actor';
import { AdversaryActorDataModel } from '../data/actor/adversary';
import { CharacterActorDataModel } from '../data/actor/character';

/**
 * Gets any relevant overrides for the given character and level
 */
export function getRelevantAdvancementOverrides(
    level: number,
    actor: CharacterActor,
): AdvancementRuleOverride[] {
    return actor.ancestry &&
        actor.ancestry.name in CONFIG.COSMERE.advancement.overrides
        ? (CONFIG.COSMERE.advancement.overrides[actor.ancestry.name][level] ??
              [])
        : [];
}

/**
 * Returns the advancement rule for the given level.
 */
export function getAdvancementRuleForLevel(
    level: number,
    actor: CharacterActor,
): AdvancementRuleConfig {
    const { rules, overrides } = CONFIG.COSMERE.advancement;

    const relevantOverrides = getRelevantAdvancementOverrides(level, actor);

    const rule =
        level >= rules.length
            ? rules[rules.length - 1] // Repeat the last rule if the level is higher than the last rule
            : rules[level - 1];

    return relevantOverrides
        ? getOverriddenRule(rule, relevantOverrides)
        : rule;
}

/**
 * Returns the all advancement rules up to and including the given level.
 * If the level is higher than the last rule, the last rule is repeated.
 * @returns An array of advancement rules with the length equal to the given level.
 */
export function getAdvancementRulesUpToLevel(
    level: number,
    actor: CharacterActor,
): AdvancementRuleConfig[] {
    return getAdvancementRulesForLevelChange(0, level, actor);
}

/**
 * Returns the all advancement rules between the start level (exclusive) and the end level (inclusive).
 * If the end level is higher than the last rule, the last rule is repeated.
 */
export function getAdvancementRulesForLevelChange(
    startLevel: number,
    endLevel: number,
    actor: CharacterActor,
): (AdvancementRuleConfig & { level: number })[] {
    // Swap the levels if the end level is lower than the start level
    if (endLevel < startLevel)
        return getAdvancementRulesForLevelChange(
            endLevel,
            startLevel,
            actor,
        ).reverse();

    // Ensure start level is at least 0
    startLevel = Math.max(0, startLevel);

    // Get the rules
    const { rules, overrides } = CONFIG.COSMERE.advancement;

    const ancestryOverrides = actor.ancestry
        ? overrides[actor.ancestry.name]
        : undefined;

    return Array.from({ length: endLevel - startLevel }, (_, i) => {
        const index = startLevel + i;
        return index >= rules.length
            ? { ...rules[rules.length - 1], level: index + 1 }
            : {
                  ...getOverriddenRule(
                      rules[index],
                      ancestryOverrides ? ancestryOverrides[index] : [],
                  ),
                  level: index + 1,
              };
    });
}

/**
 * Get overriden advancement rule
 */
export function getOverriddenRule(
    rule: AdvancementRuleConfig,
    overrides: AdvancementRuleOverride[],
): AdvancementRuleConfig {
    const overridden: AdvancementRuleConfig = { ...rule };

    // Apply each relevant override to the rule
    overrides.forEach((override) => {
        overridden[override.modifiesKey] =
            'absolute' in override
                ? override.absolute
                : override.delta + (overridden[override.modifiesKey] ?? 0);
    });

    return overridden;
}

/**
 * Derives the max health of a character at the given level and strength.
 */
export function deriveMaxHealth(
    level: number,
    strength: number,
    actor: CharacterActor,
): number;
export function deriveMaxHealth(
    rules: AdvancementRuleConfig[],
    strength: number,
    actor: CharacterActor,
): number;
export function deriveMaxHealth(
    levelOrRules: number | AdvancementRuleConfig[],
    strength: number,
    actor: CharacterActor,
): number {
    // Get rules up to the given level
    const rules = Array.isArray(levelOrRules)
        ? levelOrRules
        : getAdvancementRulesUpToLevel(levelOrRules, actor);

    // Calculate the health
    return rules.reduce(
        (health, rule) =>
            health +
            (rule.health ?? 0) +
            (rule.healthIncludeStrength ? strength : 0),
        0,
    );
}

/**
 * Derives the total amount of attribute points a character of the given level has.
 * This does not account for attribute points spent.
 */
export function deriveTotalAttributePoints(
    level: number,
    actor: CharacterActor,
): number;
export function deriveTotalAttributePoints(
    rules: AdvancementRuleConfig[],
    actor: CharacterActor,
): number;
export function deriveTotalAttributePoints(
    levelOrRules: number | AdvancementRuleConfig[],
    actor: CharacterActor,
): number {
    // Get rules up to the given level
    const rules = Array.isArray(levelOrRules)
        ? levelOrRules
        : getAdvancementRulesUpToLevel(levelOrRules, actor);

    // Calculate the attribute points
    return rules.reduce(
        (points, rule) => points + (rule.attributePoints ?? 0),
        0,
    );
}

/**
 * Derives the total amount of skill ranks a character of the given level has.
 * This does not account for skill ranks spent nor advancement rules that grant EITHER skill ranks or talents.
 */
export function deriveTotalSkillRanks(
    level: number,
    actor: CharacterActor,
): number;
export function deriveTotalSkillRanks(
    rules: AdvancementRuleConfig[],
    actor: CharacterActor,
): number;
export function deriveTotalSkillRanks(
    levelOrRules: number | AdvancementRuleConfig[],
    actor: CharacterActor,
): number {
    // Get rules up to the given level
    const rules = Array.isArray(levelOrRules)
        ? levelOrRules
        : getAdvancementRulesUpToLevel(levelOrRules, actor);

    // Calculate the skill ranks
    return rules.reduce((ranks, rule) => ranks + (rule.skillRanks ?? 0), 0);
}

/**
 * Derives the total amount of talents a character of the given level has.
 * This does not account for talents spent nor advancement rules that grant EITHER skill ranks or talents.
 */
export function deriveTotalTalents(
    level: number,
    actor: CharacterActor,
): number;
export function deriveTotalTalents(
    rules: AdvancementRuleConfig[],
    actor: CharacterActor,
): number;
export function deriveTotalTalents(
    levelOrRules: number | AdvancementRuleConfig[],
    actor: CharacterActor,
): number {
    // Get rules up to the given level
    const rules = Array.isArray(levelOrRules)
        ? levelOrRules
        : getAdvancementRulesUpToLevel(levelOrRules, actor);

    // Calculate the talents
    return rules.reduce((talents, rule) => talents + (rule.talents ?? 0), 0);
}

/**
 * Derives the total amount of skill ranks or talent choices a character of the given level has.
 */
export function deriveTotalSkillRanksOrTalentsChoices(
    level: number,
    actor: CharacterActor,
): number;
export function deriveTotalSkillRanksOrTalentsChoices(
    rules: AdvancementRuleConfig[],
    actor: CharacterActor,
): number;
export function deriveTotalSkillRanksOrTalentsChoices(
    levelOrRules: number | AdvancementRuleConfig[],
    actor: CharacterActor,
): number {
    // Get rules up to the given level
    const rules = Array.isArray(levelOrRules)
        ? levelOrRules
        : getAdvancementRulesUpToLevel(levelOrRules, actor);

    // Calculate the skill ranks
    return rules.reduce(
        (choices, rule) => choices + (rule.skillRanksOrTalents ?? 0),
        0,
    );
}
