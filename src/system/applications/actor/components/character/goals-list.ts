import { ItemType } from '@system/types/cosmere';
import { GoalItem } from '@system/documents/item';
import { MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';

// Utils
import { AppContextMenu } from '@system/applications/utils/context-menu';

import { CharacterSheet } from '../../character-sheet';

const HIDE_COMPLETED_FLAG = 'goals.hide-completed';

export class CharacterGoalsListComponent extends HandlebarsApplicationComponent<// typeof CharacterSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_GOALS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'adjust-goal-progress': {
            handler: this.onAdjustGoalProgress,
            buttons: [MouseButton.Primary, MouseButton.Secondary],
        },
        'toggle-hide-completed-goals': this.onToggleHideCompletedGoals,
        'add-goal': this.onAddGoal,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

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
            system: {
                level: newLevel,
            },
        });

        // Render
        await this.render();
    }

    public static async onToggleHideCompletedGoals(
        this: CharacterGoalsListComponent,
    ) {
        // Get current state
        const hideCompletedGoals =
            this.application.actor.getFlag(SYSTEM_ID, HIDE_COMPLETED_FLAG) ??
            false;

        // Update
        await this.application.actor.update(
            {
                flags: {
                    'cosmere-rpg': {
                        [HIDE_COMPLETED_FLAG]: !hideCompletedGoals,
                    },
                },
            },
            { render: false },
        );

        // Render
        await this.render();
    }

    public static onEditGoal(
        this: CharacterGoalsListComponent,
        element: HTMLElement,
    ) {
        const goalId = element.closest('[data-id]')?.getAttribute('data-id');
        if (!goalId) return;

        // Get the goal
        const goalItem = this.application.actor.items.get(goalId);
        if (!goalItem?.isGoal()) return;

        // Show item sheet
        void goalItem.sheet?.render(true);
    }

    public static onRemoveGoal(
        this: CharacterGoalsListComponent,
        element: HTMLElement,
    ) {
        const goalId = element.closest('[data-id]')?.getAttribute('data-id');
        if (!goalId) return;

        // Get the goal
        const goalItem = this.application.actor.items.get(goalId);
        if (!goalItem?.isGoal()) return;

        // Delete the goal
        void goalItem.delete();
    }

    public static async onAddGoal(this: CharacterGoalsListComponent) {
        // Create goal
        const goal = (await Item.create(
            {
                type: ItemType.Goal,
                name: game.i18n.localize(
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
            this.editGoal(goal.id!);
        }, 50);
    }

    /* --- Context --- */

    public async _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        const hideCompletedGoals =
            this.application.actor.getFlag(SYSTEM_ID, HIDE_COMPLETED_FLAG) ??
            false;

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

    /* --- Lifecyle --- */

    public _onInitialize(): void {
        if (!this.application.isEditable) return;

        // Create context menu
        AppContextMenu.create({
            parent: this,
            items: [
                {
                    name: 'GENERIC.Button.Edit',
                    icon: 'fa-solid fa-pen-to-square',
                    callback: CharacterGoalsListComponent.onEditGoal.bind(this),
                },
                {
                    name: 'GENERIC.Button.Remove',
                    icon: 'fa-solid fa-trash',
                    callback:
                        CharacterGoalsListComponent.onRemoveGoal.bind(this),
                },
            ],
            selectors: ['a[data-action="toggle-controls"]'],
            anchor: 'right',
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
                    name: input.val() as string,
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
