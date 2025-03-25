import { Skill } from '@system/types/cosmere';
import { Goal } from '@system/types/item';
import { CosmereItem, GoalItem, PowerItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialogs
import { EditGoalRewardDialog } from '@system/applications/item/dialogs/goal/edit-reward';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { GoalItemSheet } from '@system/applications/item';

// NOTE: Must use a type instead of an interface to match `AnyObject` type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    rewards: Collection<Goal.Reward>;
    editable?: boolean;
};

export class RewardsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<GoalItemSheet>,
    Params
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_GOAL_REWARDS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'create-reward': this.onCreateReward,
        'edit-reward': this.onEditReward,
        'remove-reward': this.onRemoveReward,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onCreateReward(
        this: RewardsListComponent,
        event: Event,
    ) {
        // Create a new reward
        const newReward: Goal.Reward = {
            type: Goal.Reward.Type.Items,
            items: [],
        };

        // Generate a unique ID
        const id = foundry.utils.randomID();

        // Add the new rule to the item
        await this.application.item.update({
            [`system.rewards.${id}`]: newReward,
        });

        // Show the edit dialog
        await EditGoalRewardDialog.show(this.application.item, {
            _id: id,
            ...newReward,
        });
    }

    private static async onEditReward(
        this: RewardsListComponent,
        event: Event,
    ) {
        // Get id
        const id = $(event.target!).closest('[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Get reward
        const reward = this.application.item.system.rewards.get(id);
        if (!reward) return;

        // Show the edit dialog
        await EditGoalRewardDialog.show(this.application.item, {
            _id: id,
            ...reward,
        });
    }

    private static async onRemoveReward(
        this: RewardsListComponent,
        event: Event,
    ) {
        // Get id
        const id = $(event.target!).closest('[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Remove the reward
        await this.application.item.update({
            [`system.rewards.-=${id}`]: null,
        });
    }

    /* --- Context --- */

    public async _prepareContext(params: Params) {
        const rewards = await Promise.all(
            params.rewards.map(async (reward) => {
                if (reward.type !== Goal.Reward.Type.Items) return reward;

                // Look up docs
                const docs = await Promise.all(
                    reward.items.map(async (itemUUID) => {
                        const doc = (await fromUuid(
                            itemUUID,
                        )) as unknown as CosmereItem;
                        return {
                            uuid: doc.uuid,
                            link: doc.toAnchor().outerHTML,
                        };
                    }),
                );

                return {
                    ...reward,
                    items: docs,
                };
            }),
        );

        return Promise.resolve({
            ...params,
            rewards: rewards.map((reward) => ({
                ...reward,
                typeLabel: CONFIG.COSMERE.items.goal.rewards.types[reward.type],
            })),
            editable: params.editable !== false,
        });
    }
}

// Register the component
RewardsListComponent.register('app-goal-rewards-list');
