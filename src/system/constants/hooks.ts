import { SYSTEM_ID } from '@system/constants';

export const HOOKS = {
    /* ----- Actor Hooks ----- */
    /* -- Damage application hooks -- */
    PRE_APPLY_DAMAGE: `${SYSTEM_ID}.preApplyDamage`,
    APPLY_DAMAGE: `${SYSTEM_ID}.applyDamage`,

    /* -- Injury Application Hooks -- */
    PRE_APPLY_INJURY: `${SYSTEM_ID}.preApplyInjury`,
    APPLY_INJURY: `${SYSTEM_ID}.applyInjury`,

    /* -- Rest Hooks -- */
    PRE_REST: `${SYSTEM_ID}.preRest`,
    REST: `${SYSTEM_ID}.rest`,

    /* ----- Item Hooks ----- */
    /* -- Item Activation/Usage Hooks -- */
    USE_ITEM: `${SYSTEM_ID}.useItem`,
    PRE_USE_ITEM: `${SYSTEM_ID}.preUseItem`,
    MODE_ACTIVATE_ITEM: `${SYSTEM_ID}.modeActivateItem`,
    PRE_MODE_ACTIVATE_ITEM: `${SYSTEM_ID}.preModeActivateItem`,
    MODE_DEACTIVATE_ITEM: `${SYSTEM_ID}.modeDeactivateItem`,
    PRE_MODE_DEACTIVATE_ITEM: `${SYSTEM_ID}.preModeDeactivateItem`,

    /**
     * Executed when a Goal Item's progresses gets updated towards completion.
     * This only counts forward progress, not executed when the goal's progress is reduced.
     */
    PROGRESS_GOAL: `${SYSTEM_ID}.progressGoal`,
    /**
     * Executed before a Goal Item's progress is updated towards completion.
     */
    PRE_PROGRESS_GOAL: `${SYSTEM_ID}.preProgressGoal`,

    /**
     * Executed when a Goal Item's progress is updated.
     */
    UPDATE_PROGRESS_GOAL: `${SYSTEM_ID}.updateProgressGoal`,
    /**
     * Executed before a Goal Item's progress is updated.
     */
    PRE_UPDATE_PROGRESS_GOAL: `${SYSTEM_ID}.preUpdateProgressGoal`,

    /**
     * Executed when a Goal Item's progress gets filled and the goal is completed.
     */
    COMPLETE_GOAL: `${SYSTEM_ID}.completeGoal`,
    /**
     * Executed before a Goal Item's progress is filled and the goal is completed.
     */
    PRE_COMPLETE_GOAL: `${SYSTEM_ID}.preCompleteGoal`,

    /* ----- Chat Message Hooks ----- */
    /* -- Message Interaction Hooks -- */
    MESSAGE_INTERACTED: `${SYSTEM_ID}.chatMessageInteract`,

    /* ----- Roll Hooks ----- */
    PRE_ROLL: (context: string) =>
        `${SYSTEM_ID}.pre${context.toLowerCase().capitalize()}Roll`,
    ROLL: (context: string) => `${SYSTEM_ID}.${context.toLowerCase()}Roll`,
    PRE_SKILL_ROLL: `${SYSTEM_ID}.preSkillRoll`,
    SKILL_ROLL: `${SYSTEM_ID}.skillRoll`,
    PRE_ITEM_ROLL: `${SYSTEM_ID}.preItemRoll`,
    ITEM_ROLL: `${SYSTEM_ID}.itemRoll`,
    PRE_ATTACK_ROLL: `${SYSTEM_ID}.preAttackRoll`,
    ATTACK_ROLL: `${SYSTEM_ID}.attackRoll`,
    PRE_DAMAGE_ROLL: `${SYSTEM_ID}.preDamageRoll`,
    DAMAGE_ROLL: `${SYSTEM_ID}.damageRoll`,
    PRE_INJURY_TYPE_ROLL: `${SYSTEM_ID}.preInjuryTypeRoll`,
    INJURY_TYPE_ROLL: `${SYSTEM_ID}.injuryTypeRoll`,
    PRE_INJURY_DURATION_ROLL: `${SYSTEM_ID}.preInjuryDurationRoll`,
    INJURY_DURATION_ROLL: `${SYSTEM_ID}.injuryDurationRoll`,
    PRE_SHORT_REST_RECOVERY_ROLL: `${SYSTEM_ID}.preShortRestRecoveryRoll`,
    SHORT_REST_RECOVERY_ROLL: `${SYSTEM_ID}.shortRestRecoveryRoll`,

    PRE_ROLL_CONFIGURATION: (context: string) =>
        `${SYSTEM_ID}.pre${context.toLowerCase().capitalize()}RollConfiguration`,
    ROLL_CONFIGURATION: (context: string) =>
        `${SYSTEM_ID}.${context.toLowerCase()}RollConfiguration`,
    PRE_SKILL_ROLL_CONFIGURATION: `${SYSTEM_ID}.preSkillRollConfiguration`,
    SKILL_ROLL_CONFIGURATION: `${SYSTEM_ID}.skillRollConfiguration`,
    PRE_ITEM_ROLL_CONFIGURATION: `${SYSTEM_ID}.preItemRollConfiguration`,
    ITEM_ROLL_CONFIGURATION: `${SYSTEM_ID}.itemRollConfiguration`,
    PRE_ATTACK_ROLL_CONFIGURATION: `${SYSTEM_ID}.preAttackRollConfiguration`,
    ATTACK_ROLL_CONFIGURATION: `${SYSTEM_ID}.attackRollConfiguration`,

    /* ---- Migration Hooks ----- */
    PRE_MIGRATION: `${SYSTEM_ID}.preMigration`,
    MIGRATION: `${SYSTEM_ID}.migration`,
    PRE_MIGRATE_VERSION: `${SYSTEM_ID}.preMigrateVersion`,
    MIGRATE_VERSION: `${SYSTEM_ID}.migrateVersion`,

    /* ----- Enricher Hooks ----- */
    TRIGGER_ENRICHER: (type: 'Test' | 'Damage') =>
        `${SYSTEM_ID}.trigger${type.toLowerCase().capitalize()}Enricher`,
    TRIGGER_TEST_ENRICHER: `${SYSTEM_ID}.triggerTestEnricher`,
    TRIGGER_DAMAGE_ENRICHER: `${SYSTEM_ID}.triggerDamageEnricher`,
} as const;
