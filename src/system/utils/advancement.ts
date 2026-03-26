import * as Advancement from '@system/types/advancement';
import {
    AdvancementRuleConfig,
    AdvancementOverrideConfig,
} from '@system/types/config';

import { CharacterActor } from '@system/documents/actor';
import { SYSTEM_ID } from '@system/constants';
import { Attribute, Skill } from '../types/cosmere';
import { HOOKS } from '../constants/hooks';

export class AdvancementOverride {
    public readonly type: Advancement.OverrideType;
    public readonly mode: Advancement.OverrideMode;
    public readonly key:
        | Advancement.GenericFieldKey
        | Advancement.MaxStatFieldKey;
    public readonly stat?: Advancement.MaxStatType;
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
                    `override not implemented for type ${data.type as string}`,
                );
        }

        this.type = data.type;
        this.mode = data.mode;
        this.key = data.key;
        this.value = data.value;

        if (data.type === Advancement.OverrideType.Maximum) {
            this.stat = data.stat;
        }
    }

    // Override application

    /**
     * Mutate the provided rule according to the override's configuration
     */
    public apply(rule: AdvancementRule): AdvancementRule {
        switch (this.type) {
            case Advancement.OverrideType.Generic:
                return this._applyGeneric(rule);
            case Advancement.OverrideType.Maximum:
                return this._applyMaximum(rule);
        }
    }

    /**
     * Apply this override's data to a given rule's generic field
     */
    private _applyGeneric(rule: AdvancementRule): AdvancementRule {
        const key = this.key as Advancement.GenericFieldKey;
        const updatedValue =
            this.mode === Advancement.OverrideMode.Absolute
                ? this.value
                : // Relative overrides must be numeric. This is asserted in the constructor,
                  // so we can safely assume that here.
                  (this.value as number) + ((rule.fields[key] as number) ?? 0);
        rule.fields = {
            ...rule.fields,
            [key]: updatedValue,
        };

        return rule;
    }

    /**
     * Apply this override's data to a given rule's maximum stats
     */
    private _applyMaximum(rule: AdvancementRule): AdvancementRule {
        const key = this.key as Advancement.MaxStatFieldKey;
        const stat = this.stat ?? 'base';

        // Reconstruct the max stats, replacing the relevant entry
        rule.maxStats = {
            ...rule.maxStats,
            [key]: {
                ...rule.maxStats[key],
                [stat]:
                    this.mode === Advancement.OverrideMode.Absolute
                        ? (this.value as number)
                        : (this.value as number) +
                          rule.getMaxForStat(key, stat),
            },
        };

        return rule;
    }
}

export class AdvancementRule {
    public level: number;
    public tier: number;
    public fields: Advancement.GenericFields;
    public maxStats: Advancement.MaxStatFields;

    constructor(data: AdvancementRuleConfig) {
        this.level = data.level;
        this.tier = data.tier;
        this.fields = data.fields;
        this.maxStats = data.maxStats;
    }

    public getMaxForStat(
        field: Advancement.MaxStatFieldKey,
        stat: Advancement.MaxStatType | 'base',
    ): number {
        if (stat === 'base') return this.maxStats[field].base ?? 0;

        switch (field) {
            case Advancement.MaxStatFieldKey.Attributes:
                return this.maxStats[field][stat as Attribute] ?? 0;
            case Advancement.MaxStatFieldKey.Skills:
                return this.maxStats[field][stat as Skill] ?? 0;
        }
    }

    /**
     * Apply a list of overrides to this rule, and return the result.
     * The state of this rule is preserved.
     * @param overrides
     * @returns
     */
    public applyOverrides(overrides: AdvancementOverride[]): AdvancementRule {
        const rule = this.clone();

        overrides.forEach((override) => rule.applyOverrideInPlace(override));

        return rule;
    }

    /**
     * Get a new rule with the override applied.
     * The state of this rule is preserved.
     * @param override
     * @returns
     */
    public applyOverride(override: AdvancementOverride): AdvancementRule {
        return this.clone().applyOverrideInPlace(override);
    }

    /**
     * Mutate this rule with the given override.
     * @param override
     * @returns
     */
    public applyOverrideInPlace(
        override: AdvancementOverride,
    ): AdvancementRule {
        if (!Hooks.call(HOOKS.PRE_OVERRIDE_ADVANCEMENT, this, override)) {
            return this;
        }

        override.apply(this);

        Hooks.callAll(HOOKS.OVERRIDE_ADVANCEMENT, this, override);

        return this;
    }

    // Helpers

    public clone(): AdvancementRule {
        return new AdvancementRule({
            level: this.level,
            tier: this.tier,
            fields: {
                ...this.fields,
            },
            maxStats: {
                attributes: { ...this.maxStats.attributes },
                skills: { ...this.maxStats.skills },
            },
        });
    }
}

export default class AdvancementManager {
    static readonly rules: AdvancementRule[] = [];
    static readonly overrides: Record<
        string,
        Record<number, AdvancementOverride[]>
    > = {};

    // Rule registration

    public static init() {
        // Get base advancement rules from config
        const { rules, overrides } = CONFIG.COSMERE.advancement;

        rules.forEach((rule) => this.registerAdvancementRule(rule));

        this.registerAdvancementOverrides(overrides);

        console.log(`[${SYSTEM_ID}] Advancement manager initialized`);
    }

    public static registerAdvancementRule(
        data: AdvancementRuleConfig,
    ): AdvancementRule[] {
        this.rules.push(new AdvancementRule(data));
        return this.rules;
    }

    public static registerAdvancementOverrides(
        data: AdvancementOverrideConfig,
    ) {
        Object.keys(data).forEach((ancestry) => {
            data[ancestry].forEach((overrides, level) => {
                overrides.forEach((override) => {
                    this.registerAdvancementOverride(ancestry, level, override);
                });
            });
        });
    }

    public static registerAdvancementOverride(
        ancestry: string,
        level: number,
        data: Advancement.OverrideData,
    ): boolean {
        let override: AdvancementOverride;
        try {
            override = new AdvancementOverride(data);
        } catch (error) {
            console.error(`[${SYSTEM_ID}] Error registering override:`, error);
            return false;
        }

        if (!Hooks.call(HOOKS.PRE_REGISTER_ADVANCEMENT_OVERRIDE, override)) {
            return false;
        }

        const existingOverrides = this.overrides[ancestry] ?? {};
        const overridesAtLevel = existingOverrides[level] ?? [];

        overridesAtLevel.push(override);

        existingOverrides[level] = overridesAtLevel;
        this.overrides[ancestry] = existingOverrides;

        Hooks.callAll(HOOKS.REGISTER_ADVANCEMENT_OVERRIDE, override);

        return true;
    }

    /**
     * Gets any relevant overrides for the given character and level
     */
    public static getRelevantAdvancementOverrides(
        level: number,
        actor: CharacterActor,
    ): AdvancementOverride[] {
        return actor.ancestry && actor.ancestry.system.id in this.overrides
            ? (this.overrides[actor.ancestry.system.id][level] ?? [])
            : [];
    }

    /**
     * Returns the advancement rule for the given level.
     */
    public static getAdvancementRuleForLevel(
        level: number,
        actor: CharacterActor,
    ): AdvancementRule {
        const relevantOverrides =
            AdvancementManager.getRelevantAdvancementOverrides(level, actor);

        const rule =
            level >= this.rules.length
                ? this.rules[this.rules.length - 1] // Repeat the last rule if the level is higher than the last rule
                : this.rules[level - 1];

        return rule.applyOverrides(relevantOverrides);
    }

    /**
     * Returns the all advancement rules up to and including the given level.
     * If the level is higher than the last rule, the last rule is repeated.
     * @returns An array of advancement rules with the length equal to the given level.
     */
    public static getAdvancementRulesUpToLevel(
        level: number,
        actor: CharacterActor,
    ): AdvancementRule[] {
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
    ): AdvancementRule[] {
        // Swap the levels if the end level is lower than the start level
        if (endLevel < startLevel)
            return this.getAdvancementRulesForLevelChange(
                endLevel,
                startLevel,
                actor,
            ).reverse();

        // Ensure start level is at least 0
        startLevel = Math.max(0, startLevel);

        const ancestryOverrides = actor.ancestry
            ? (this.overrides[actor.ancestry.system.id] ?? [])
            : [];

        return Array.from({ length: endLevel - startLevel }, (_, i) => {
            const index = startLevel + i;
            const rule =
                this.rules[Math.min(index, this.rules.length - 1)].clone();
            if (index >= this.rules.length) rule.level = index + 1;

            return rule.applyOverrides(ancestryOverrides[index + 1] ?? []);
        });
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
        rules: AdvancementRule[],
        strength: number,
        actor: CharacterActor,
    ): number;
    public static deriveMaxHealth(
        levelOrRules: number | AdvancementRule[],
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
                (rule.fields.health ?? 0) +
                (rule.fields.healthIncludeStrength ? strength : 0),
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
        rules: AdvancementRule[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalAttributePoints(
        levelOrRules: number | AdvancementRule[],
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
            (points, rule) => points + (rule.fields.attributePoints ?? 0),
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
        rules: AdvancementRule[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanks(
        levelOrRules: number | AdvancementRule[],
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
            (ranks, rule) => ranks + (rule.fields.skillRanks ?? 0),
            0,
        );
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
        rules: AdvancementRule[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalTalents(
        levelOrRules: number | AdvancementRule[],
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
            (talents, rule) => talents + (rule.fields.talents ?? 0),
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
        rules: AdvancementRule[],
        actor: CharacterActor,
    ): number;
    public static deriveTotalSkillRanksOrTalentsChoices(
        levelOrRules: number | AdvancementRule[],
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
            (choices, rule) => choices + (rule.fields.skillRanksOrTalents ?? 0),
            0,
        );
    }
}
