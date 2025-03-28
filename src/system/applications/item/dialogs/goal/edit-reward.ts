import { Skill } from '@system/types/cosmere';
import { GoalItem } from '@system/documents/item';
import { Goal } from '@system/types/item';
import { AnyObject } from '@system/types/utils';
import { CollectionField } from '@system/data/fields';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

type RewardData = {
    _id: string;
} & Goal.Reward;

export class EditGoalRewardDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                title: 'DIALOG.EditGrantRule.Title',
                minimizable: false,
                resizable: false,
                positioned: true,
            },
            classes: ['dialog', 'edit-reward'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                update: this.onUpdateReward,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_EDIT_REWARD}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private constructor(
        private goal: GoalItem,
        private reward: RewardData,
    ) {
        super({
            id: `${goal.uuid}.Rewards.${reward._id}`,
            window: {
                title: 'DIALOG.EditGoalReward.Title',
            },
        });
    }

    /* --- Statics --- */

    public static async show(goal: GoalItem, reward: RewardData) {
        const dialog = new this(goal, foundry.utils.deepClone(reward));
        await dialog.render(true);
    }

    /* --- Actions --- */

    private static async onUpdateReward(this: EditGoalRewardDialog) {
        // Validate
        if (
            this.reward.type === Goal.Reward.Type.SkillRanks &&
            (this.reward.skill === null || this.reward.ranks === null)
        ) {
            ui.notifications.error(
                'COSMERE.Item.Goal.Reward.Validation.MissingSkillOrRanks',
            );
            return;
        } else if (
            this.reward.type === Goal.Reward.Type.Items &&
            this.reward.items === null
        ) {
            ui.notifications.error(
                'COSMERE.Item.Goal.Reward.Validation.MissingItems',
            );
            return;
        }

        // Prepare updates
        const updates =
            this.reward.type === Goal.Reward.Type.SkillRanks
                ? {
                      type: this.reward.type,
                      skill: this.reward.skill,
                      ranks: this.reward.ranks,
                  }
                : {
                      type: this.reward.type,
                      items: this.reward.items,
                  };

        // Perform updates
        await this.goal.update({
            [`system.rewards.${this.reward._id}`]: updates,
        });

        // Close
        void this.close();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: EditGoalRewardDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        // Get type
        this.reward.type = formData.get('type') as Goal.Reward.Type;

        if (
            this.reward.type === Goal.Reward.Type.SkillRanks &&
            formData.has('skill')
        ) {
            this.reward.skill = formData.get('skill') as Skill;
            this.reward.ranks = parseInt(formData.get('ranks') as string, 10);
        } else if (
            this.reward.type === Goal.Reward.Type.Items &&
            formData.has('items')
        ) {
            this.reward.items = formData.object.items as unknown as string[];
        }

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    public _prepareContext() {
        return Promise.resolve({
            goal: this.goal,
            ...this.reward,

            schema: (this.goal.system.schema.fields.rewards as CollectionField)
                .model,
        });
    }
}
