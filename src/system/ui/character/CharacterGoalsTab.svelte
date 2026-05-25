<script lang="ts">
    import { localize } from '../../utils/i18n';
    import type { GoalDisplay } from '../utils/types'
    import CharacterGoalsList from './CharacterGoalsList.svelte';

    export let tabCssClass: string = '';
    export let isEditMode: boolean = false;
    export let purpose: string = '';
    export let obstacle: string = '';
    export let goals: GoalDisplay[] = [];
    export let hideCompletedGoals: boolean = false;
    export let onPurposeChange: (value: string) => void = () => {};
    export let onObstacleChange: (value: string) => void = () => {};
    export let onAdjustGoalProgress: (
        goalId: string,
        direction: 'increase' | 'decrease',
    ) => void = () => {};
    export let onAddGoal: () => void = () => {};
    export let onToggleHideCompletedGoals: () => void = () => {};

    let localPurpose = purpose;
    let localObstacle = obstacle;

    function savePurpose() {
        if (localPurpose !== purpose) {
            onPurposeChange(localPurpose);
        }
    }

    function saveObstacle() {
        if (localObstacle !== obstacle) {
            onObstacleChange(localObstacle);
        }
    }
</script>

<div
    class={`tab tab-content split ${tabCssClass}`}
    data-tab="goals"
    data-group="primary"
>
    <section>
        <div class="details-text purpose">
            <div class="icon-header">
                <div class="title">
                    <i class="fa-solid fa-seedling"></i>
                    <span>{localize('COSMERE.Actor.Sheet.Details.Purpose')}</span>
                </div>
            </div>

            <textarea
                name="system.purpose"
                readonly={!isEditMode}
                bind:value={localPurpose}
                on:blur={savePurpose}
            ></textarea>
        </div>
        
        <CharacterGoalsList
            {goals}
            editable={isEditMode}
            {hideCompletedGoals}
            {onAddGoal}
            {onToggleHideCompletedGoals}
            {onAdjustGoalProgress}
        />

    </section>

    <section>
        <div class="details-text obstacle">
            <div class="icon-header">
                <div class="title">
                    <i class="fa-solid fa-heart-crack"></i>
                    <span>{localize('COSMERE.Actor.Sheet.Details.Obstacle')}</span>                
                </div>
            </div>

            <textarea
                name="system.obstacle"
                readonly={!isEditMode}
                bind:value={localObstacle}
                on:blur={saveObstacle}
            ></textarea>
        </div>

        <!-- Connections list migration comes next -->
    </section>
</div>