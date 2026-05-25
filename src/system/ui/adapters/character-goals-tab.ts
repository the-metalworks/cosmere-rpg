// src/system/ui/adapters/character-goals-tab.ts

import { SYSTEM_ID } from '@src/system/constants';
import type { CharacterActor } from '@system/documents';
import type { GoalDisplay } from '../utils/types'

export function getCharacterGoalsTabProps(
    actor: CharacterActor,
    tabCssClass: string,
    isEditMode: boolean,
    onPurposeChange: (value: string) => Promise<void> | void,
    onObstacleChange: (value: string) => Promise<void> | void,
    onAdjustGoalProgress: (
        goalId: string,
        direction: 'increase' | 'decrease',
    ) => Promise<void> | void,
    onAddGoal: () => Promise<void> | void,
    onToggleHideCompletedGoals: () => Promise<void> | void,
) {
    const hideCompletedGoals = actor.getFlag(SYSTEM_ID, 'goals.hide-completed') ?? false;

    const goals: GoalDisplay[] = actor.goals
        .map((goal) => ({
            id: goal.id!,
            name: goal.name,
            level: goal.system.level,
            achieved: goal.system.level >= 3,
        }))
        .filter((goal) => !hideCompletedGoals || !goal.achieved);

    return {
        tabCssClass,
        isEditMode,

        purpose: actor.system.purpose ?? '',
        obstacle: actor.system.obstacle ?? '',

        goals,
        hideCompletedGoals,
        
        onPurposeChange,
        onObstacleChange,
        onAdjustGoalProgress,
        onAddGoal,
        onToggleHideCompletedGoals,
    };
}