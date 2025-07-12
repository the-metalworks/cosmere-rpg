import { ItemType } from '@system/types/cosmere';
import { GoalItem } from '@system/documents/item';
import { ConstructorOf, MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';

import { CharacterSheet } from '../../character-sheet';

const HIDE_COMPLETED_FLAG = 'goals.hide-completed';

export class CharacterGoalsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_GOALS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-goal-controls': this.onToggleGoalControls,
        'adjust-goal-progress': {
            handler: this.onAdjustGoalProgress,
            buttons: [MouseButton.Primary, MouseButton.Secondary],
        },
        'toggle-hide-completed-goals': this.onToggleHideCompletedGoals,
        'edit-goal': this.onEditGoal,
        'remove-goal': this.onRemoveGoal,
        'add-goal': this.onAddGoal,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private contextGoalId: string | null = null;
    private controlsDropdownExpanded = false;

    /* --- Actions --- */

    public static onToggleGoalControls(
        this: CharacterGoalsListComponent,
        event: PointerEvent,
    ) {
        // Get goal id
        const goalId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as string;

        const target = event.currentTarget as HTMLElement;
        const root = $(target).closest('.tab-body');
        const dropdown = $(target)
            .closest('.item-list')
            .siblings('.controls-dropdown');

        const targetRect = target.getBoundingClientRect();
        const rootRect = root[0].getBoundingClientRect();

        if (this.contextGoalId !== goalId) {
            dropdown.css({
                top: `${Math.round(targetRect.top - rootRect.top)}px`,
                right: `${Math.round(rootRect.right - targetRect.right + targetRect.width)}px`,
            });

            if (!this.controlsDropdownExpanded) {
                dropdown.addClass('expanded');
                this.controlsDropdownExpanded = true;
            }

            this.contextGoalId = goalId;
        } else if (this.controlsDropdownExpanded) {
            dropdown.removeClass('expanded');
            this.controlsDropdownExpanded = false;
            this.contextGoalId = null;
        }
    }

    public static async onAdjustGoalProgress(
        this: CharacterGoalsListComponent,
        event: Event,
    ) {
        if (!this.application.isEditable) return;

        const incrementBool: boolean = event.type === 'click' ? true : false;

        // Get goal id
        const goalId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as string | undefined;
        if (!goalId) return;

        // Get the goal
        const goalItem = this.application.actor.items.get(goalId);
        if (!goalItem?.isGoal()) return;

        // Get the goal's current level
        const currentLevel = goalItem.system.level;

        // Calculate the new level
        const newLevel = incrementBool
            ? Math.min(currentLevel + 1, 3)
            : Math.max(currentLevel - 1, 0);

        // Update the goal
        await goalItem.update({
            'system.level': newLevel,
        });

        // Render
        await this.render();
    }

    public static async onToggleHideCompletedGoals(
        this: CharacterGoalsListComponent,
    ) {
        // Get current state
        const hideCompletedGoals =
            this.application.actor.getFlag<boolean>(
                SYSTEM_ID,
                HIDE_COMPLETED_FLAG,
            ) ?? false;

        // Update
        await this.application.actor.update(
            {
                [`flags.cosmere-rpg.${HIDE_COMPLETED_FLAG}`]:
                    !hideCompletedGoals,
            },
            { render: false },
        );

        // Close controls dropdown if it happens to be open
        this.controlsDropdownExpanded = false;

        // Render
        await this.render();
    }

    public static async onEditGoal(this: CharacterGoalsListComponent) {
        this.controlsDropdownExpanded = false;

        // Render
        await this.render();

        // Ensure context goal id is set
        if (this.contextGoalId !== null) {
            // Get the goal
            const goalItem = this.application.actor.items.get(
                this.contextGoalId,
            );
            if (!goalItem?.isGoal()) return;

            // Show item sheet
            void goalItem.sheet?.render(true);

            this.contextGoalId = null;
        }
    }

    public static async onRemoveGoal(this: CharacterGoalsListComponent) {
        this.controlsDropdownExpanded = false;

        // Ensure context goal id is set
        if (this.contextGoalId !== null) {
            // Get the goal
            const goalItem = this.application.actor.items.get(
                this.contextGoalId,
            );
            if (!goalItem?.isGoal()) return;

            // Delete the goal
            await goalItem.delete();

            this.contextGoalId = null;
        }
    }

    public static async onAddGoal(this: CharacterGoalsListComponent) {
        // Ensure controls dropdown is closed
        this.controlsDropdownExpanded = false;

        // Create goal
        const goal = (await Item.create(
            {
                type: ItemType.Goal,
                name: game.i18n!.localize(
                    'COSMERE.Actor.Sheet.Details.Goals.NewText',
                ),
                system: {
                    level: 0,
                },
            },
            { parent: this.application.actor },
        )) as GoalItem;

        setTimeout(() => {
            // Edit the goal
            this.editGoal(goal.id);
        }, 50);
    }

    /* --- Context --- */

    public async _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        const hideCompletedGoals =
            this.application.actor.getFlag<boolean>(
                SYSTEM_ID,
                HIDE_COMPLETED_FLAG,
            ) ?? false;

        return Promise.resolve({
            ...context,

            goals: this.application.actor.goals
                .map((goal) => ({
                    id: goal.id,
                    name: goal.name,
                    level: goal.system.level,
                    achieved: goal.system.level === 3,
                }))
                .filter((goal) => !hideCompletedGoals || !goal.achieved),

            hideCompletedGoals,
        });
    }

    /* --- Helpers --- */

    private editGoal(id: string) {
        // Get goal element
        const element = $(this.element!).find(`.item[data-id="${id}"]`);

        // Get input element
        const input = element.find('input.name');

        // Set not readonly
        input.prop('readonly', false);

        setTimeout(() => {
            // Focus input
            input.trigger('select');

            // Add event handler
            input.on('focusout', async () => {
                // Remove handler
                input.off('focusout');

                // Get the goal
                const goal = this.application.actor.items.get(id) as GoalItem;

                // Update the connection
                await goal.update({
                    name: input.val(),
                });

                // Render
                void this.render();
            });

            input.on('keypress', (event) => {
                if (event.which !== 13) return; // Enter key

                event.preventDefault();
                event.stopPropagation();

                input.trigger('focusout');
            });
        });
    }
}

// Register
CharacterGoalsListComponent.register('app-character-goals-list');
