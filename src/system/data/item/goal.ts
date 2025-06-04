import { Goal } from '@system/types/item';
import { CosmereItem } from '@system/documents';

import { CollectionField } from '@system/data/fields';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EventsItemMixin, EventsItemData } from './mixins/events';

export interface GoalItemData
    extends IdItemData,
        DescriptionItemData,
        EventsItemData {
    /**
     * The progress level of the goal
     */
    level: number;

    /**
     * The rewards for completing the goal
     */
    rewards: Collection<Goal.Reward>;
}

export class GoalItemDataModel extends DataModelMixin<
    GoalItemData,
    CosmereItem
>(
    IdItemMixin({
        initialFromName: true,
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Goal.desc_placeholder',
    }),
    EventsItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            level: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                max: 3,
                initial: 0,
                label: 'COSMERE.Item.Goal.Level.Label',
            }),

            rewards: new CollectionField(
                new foundry.data.fields.SchemaField(
                    {
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            initial: Goal.Reward.Type.Items,
                            label: 'COSMERE.Item.Goal.Reward.Type.Label',
                            choices: CONFIG.COSMERE.items.goal.rewards.types,
                        }),

                        // Skill ranks reward
                        skill: new foundry.data.fields.StringField({
                            required: false,
                            nullable: true,
                            blank: false,
                            initial: null,
                            label: 'COSMERE.Item.Goal.Reward.Skill.Label',
                            choices: Object.entries(
                                CONFIG.COSMERE.skills,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                        }),
                        ranks: new foundry.data.fields.NumberField({
                            required: false,
                            nullable: true,
                            initial: 0,
                            integer: true,
                            min: 0,
                            label: 'COSMERE.Item.Goal.Reward.Ranks.Label',
                        }),

                        // Items reward
                        items: new foundry.data.fields.ArrayField(
                            new foundry.data.fields.DocumentUUIDField({
                                blank: false,
                            }),
                            {
                                required: false,
                                nullable: true,
                                initial: [],
                                label: 'COSMERE.Item.Goal.Reward.Items.Label',
                            },
                        ),
                    },
                    {
                        nullable: true,
                        validate: (value: Goal.Reward) => {
                            if (value.type === Goal.Reward.Type.SkillRanks) {
                                if (!('skill' in value))
                                    throw new Error(
                                        `Field "skill" is required for reward type "${Goal.Reward.Type.SkillRanks}"`,
                                    );
                                if (!('ranks' in value))
                                    throw new Error(
                                        `Field "ranks" is required for reward type "${Goal.Reward.Type.SkillRanks}"`,
                                    );
                            } else if (value.type === Goal.Reward.Type.Items) {
                                if (!('items' in value))
                                    throw new Error(
                                        `Field "items" is required for reward type "${Goal.Reward.Type.Items}"`,
                                    );
                                if (!Array.isArray(value.items))
                                    throw new Error(
                                        `Field "items" must be an array for reward type "${Goal.Reward.Type.Items}"`,
                                    );
                                if (
                                    value.items.some(
                                        (i) => typeof i !== 'string',
                                    )
                                )
                                    throw new Error(
                                        `Field "items" must be an array of strings for reward type "${Goal.Reward.Type.Items}"`,
                                    );
                            }
                        },
                    },
                ),
            ),
        });
    }
}
