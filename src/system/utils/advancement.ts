import {
    AdvancementRuleConfig,
    AdvancementRuleOverride,
} from '@system/types/config';

import * as Advancement from '@system/types/advancement';

import { CharacterActor } from '@system/documents/actor';
import { SYSTEM_ID } from '@system/constants';

export class AdvancementOverride {
    public readonly type: Advancement.OverrideType;
    public readonly mode: Advancement.OverrideMode;
    public readonly key:
        | Advancement.OverridableFieldKey
        | Advancement.MaxStatFieldKey;
    public readonly value: Advancement.OverrideFieldType;

    constructor(data: Advancement.OverrideData) {
        // Validate incoming data for the given override type
        switch (data.type) {
            case Advancement.OverrideType.Generic:
                Advancement.assertValidGenericOverride(data);
                break;
            case Advancement.OverrideType.Maximum:
                Advancement.assertValidMaximumOverride(data);
                break;
            default:
                throw new Error(
                    `${SYSTEM_ID}: override not implemented for type ${data.type as string}`,
                );
        }

        this.type = data.type;
        this.mode = data.mode;
        this.key = data.key;
        this.value = data.value;
    }

    public apply(rule: AdvancementRule) {
        // TODO: this
        return;
    }
}

export class AdvancementRule {
    public level: number;
    public tier: number;

    // public fields: Partial<Advancement.GenericFields>;
    public maxStats: Advancement.MaxStatFields | undefined;

    constructor(data: Advancement.RuleData) {
        this.level = data.level;
        this.tier = data.tier;
        // this.fields = data.fields;
        this.maxStats = data.maxStats;
    }

    // Mutates the rule in-place
    public applyOverride(override: AdvancementOverride): AdvancementRule {
        override.apply(this);

        return this;
    }
}

export default class AdvancementManager {
    static rules: AdvancementRule[];

    /**
     * Gets any relevant overrides for the given character and level
     */
    public static getRelevantAdvancementOverrides(
        level: number,
        actor: CharacterActor,
    ): AdvancementRuleOverride[] {
        return actor.ancestry &&
            actor.ancestry.name in CONFIG.COSMERE.advancement.overrides
            ? (CONFIG.COSMERE.advancement.overrides[actor.ancestry.name][
                  level
              ] ?? [])
            : [];
    }

    /**
     * Returns the advancement rule for the given level.
     */
    public static getAdvancementRuleForLevel(
        level: number,
        actor: CharacterActor,
    ): AdvancementRuleConfig {
        const { rules, overrides } = CONFIG.COSMERE.advancement;

        const relevantOverrides =
            AdvancementManager.getRelevantAdvancementOverrides(level, actor);

        const rule =
            level >= rules.length
                ? rules[rules.length - 1] // Repeat the last rule if the level is higher than the last rule
                : rules[level - 1];

        return relevantOverrides
            ? AdvancementManager.getOverriddenRule(rule, relevantOverrides)
            : rule;
    }

    /**
     * Returns the all advancement rules up to and including the given level.
     * If the level is higher than the last rule, the last rule is repeated.
     * @returns An array of advancement rules with the length equal to the given level.
     */
    public static getAdvancementRulesUpToLevel(
        level: number,
        actor: CharacterActor,
    ): AdvancementRuleConfig[] {
        return AdvancementManager.getAdvancementRulesForLevelChange(
            0,
            level,
            actor,
        );
    }

    /**
     * Returns the all advancement rules between the start level (exclusive) and the end level (inclusive).
     * If the end level is higher than the last rule, the last rule is repeated.
     */
    public static getAdvancementRulesForLevelChange(
        startLevel: number,
        endLevel: number,
        actor: CharacterActor,
    ): (AdvancementRuleConfig & { level: number })[] {
        // Swap the levels if the end level is lower than the start level
        if (endLevel < startLevel)
            return AdvancementManager.getAdvancementRulesForLevelChange(
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
                      ...AdvancementManager.getOverriddenRule(
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
    public static getOverriddenRule(
        rule: AdvancementRuleConfig,
        overrides: AdvancementRuleOverride[],
    ): AdvancementRuleConfig {
        const overridden: AdvancementRuleConfig = { ...rule };

        // Apply each relevant override to the rule
        overrides.forEach((override) => {
            const isGeneric = 'genericKey' in override;
            const isAbsolute = 'absolute' in override;
            // Generic override
            if (isGeneric) {
                overridden[override.genericKey] = isAbsolute
                    ? override.absolute
                    : override.delta + (overridden[override.genericKey] ?? 0);
            }
        });

        return overridden;
    }

    /**
     * Derives the max health of a character at the given level and strength.
     */
    public static deriveMaxHealth(
        level: number,
        strength: number,
        actor: CharacterActor,
    ): number;
    public static deriveMaxHealth(
        rules: AdvancementRuleConfig[],
        strength: number,
        actor: CharacterActor,
    ): number;
    public static deriveMaxHealth(
        levelOrRules: number | AdvancementRuleConfig[],
        strength: number,
        actor: CharacterActor,
    ): number {
        // Get rules up to the given level
        const rules = Array.isArray(levelOrRules)
            ? levelOrRules
            : AdvancementManager.getAdvancementRulesUpToLevel(
                  levelOrRules,
                  actor,
              );

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
    public static deriveTotalAttributePoints(
        level: number,
        actor: CharacterActor,
    ): number;
    public static deriveTotalAttributePoints(
        rules: AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalAttributePoints(
        levelOrRules: number | AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number {
        // Get rules up to the given level
        const rules = Array.isArray(levelOrRules)
            ? levelOrRules
            : AdvancementManager.getAdvancementRulesUpToLevel(
                  levelOrRules,
                  actor,
              );

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
    public static deriveTotalSkillRanks(
        level: number,
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanks(
        rules: AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanks(
        levelOrRules: number | AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number {
        // Get rules up to the given level
        const rules = Array.isArray(levelOrRules)
            ? levelOrRules
            : AdvancementManager.getAdvancementRulesUpToLevel(
                  levelOrRules,
                  actor,
              );

        // Calculate the skill ranks
        return rules.reduce((ranks, rule) => ranks + (rule.skillRanks ?? 0), 0);
    }

    /**
     * Derives the total amount of talents a character of the given level has.
     * This does not account for talents spent nor advancement rules that grant EITHER skill ranks or talents.
     */
    public static deriveTotalTalents(
        level: number,
        actor: CharacterActor,
    ): number;
    public static deriveTotalTalents(
        rules: AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalTalents(
        levelOrRules: number | AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number {
        // Get rules up to the given level
        const rules = Array.isArray(levelOrRules)
            ? levelOrRules
            : AdvancementManager.getAdvancementRulesUpToLevel(
                  levelOrRules,
                  actor,
              );

        // Calculate the talents
        return rules.reduce(
            (talents, rule) => talents + (rule.talents ?? 0),
            0,
        );
    }

    /**
     * Derives the total amount of skill ranks or talent choices a character of the given level has.
     */
    public static deriveTotalSkillRanksOrTalentsChoices(
        level: number,
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanksOrTalentsChoices(
        rules: AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanksOrTalentsChoices(
        levelOrRules: number | AdvancementRuleConfig[],
        actor: CharacterActor,
    ): number {
        // Get rules up to the given level
        const rules = Array.isArray(levelOrRules)
            ? levelOrRules
            : AdvancementManager.getAdvancementRulesUpToLevel(
                  levelOrRules,
                  actor,
              );

        // Calculate the skill ranks
        return rules.reduce(
            (choices, rule) => choices + (rule.skillRanksOrTalents ?? 0),
            0,
        );
    }
}
