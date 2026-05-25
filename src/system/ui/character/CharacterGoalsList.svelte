<script lang="ts">
    import { localize } from '../../utils/i18n';
    import type { GoalDisplay } from '../utils/types'
    const MAX_GOAL_PIPS = 3;

    export let goals: GoalDisplay[] = [];
    export let editable: boolean = false;
    export let hideCompletedGoals: boolean = false;
    export let onAddGoal: () => void = () => {};
    export let onToggleHideCompletedGoals: () => void = () => {};
    export let onAdjustGoalProgress: (
        goalId: string,
        direction: 'increase' | 'decrease',
    ) => void = () => {};


    function handleProgressClick(event: MouseEvent, goalId: string) {
        if (!editable) return;

        event.preventDefault();

        const direction = event.type === 'contextmenu'
            ? 'decrease'
            : 'increase';

        onAdjustGoalProgress(goalId, direction);
    }
</script>

<ul class="item-list bullet-list">
    <li class="item header">
        <section class="details">
            <span class="title">{localize('COSMERE.Actor.Sheet.Details.Goals.Label')}</span>
        </section>
    </li>

    {#each goals as goal (goal.id)}
        <li class:achieved={goal.achieved} class="item" data-id={goal.id}>
            <section class="details">
                <i class="bullet fade icon faded fa-solid fa-diamond"></i>
                <input class="name fade" type="text" value={goal.name} readonly />

                <button
                    class="fade"
                    type="button"
                    data-action="adjust-goal-progress"
                    disabled={!editable}
                    data-tooltip={
                        localize('COSMERE.Actor.Sheet.Details.Goals.AdjustProgressTooltipInc')
                        + '<br>'
                        + localize('COSMERE.Actor.Sheet.Details.Goals.AdjustProgressTooltipDec')
                    }
                    on:click={(event) => handleProgressClick(event, goal.id)}
                    on:contextmenu={(event) => handleProgressClick(event, goal.id)}
                >
                    <ul class="pip-list">
                        {#each { length: goal.level } as _}
                            <li class="pip active">
                                <div></div>
                            </li>
                        {/each}

                        {#each { length: MAX_GOAL_PIPS - goal.level } as _}
                            <li class="pip">
                                <div></div>
                            </li>
                        {/each}
                    </ul>
                </button>

                <div class="controls icon faded">
                    {#if editable}
                        <button
                            type="button"
                            data-action="toggle-controls"
                            data-tooltip={localize('APPLICATION.TOOLS.ToggleControls')}
                        >
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    {/if}
                </div>
            </section>
        </li>
    {/each}

    {#if editable}
        <li class="item new">
            <button 
                type="button"
                data-action="add-goal" 
                on:click={onAddGoal}
            >
                <i class="fa-solid fa-plus"></i>
                <span>{localize('COSMERE.Actor.Sheet.Details.Goals.New')}</span>
            </button>
        </li>
    {/if}
</ul>

{#if editable}
    <div class="hide-completed">
        <button
            class:active={hideCompletedGoals}
            type="button"
            data-action="toggle-hide-completed-goals"
            on:click={onToggleHideCompletedGoals}
        >
            <span class="label">{localize('COSMERE.Actor.Sheet.Details.Goals.HideComplete')}</span>

            {#if hideCompletedGoals}
                <i class="fa-solid fa-toggle-on"></i>
            {:else}
                <i class="fa-solid fa-toggle-off"></i>
            {/if}
        </button>
    </div>
{/if}