import { Skill } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/event-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface ModifySkillRankHandlerConfigData {
    /**
     * The skill to modify
     */
    skill: Skill;

    /**
     * The amount to modify the skill rank by
     */
    amount: number;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.ModifySkillRank,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifySkillRank}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifySkillRank}.Description`,
        config: {
            schema: {
                skill: new foundry.data.fields.StringField({
                    required: true,
                    blank: false,
                    initial: () => Object.keys(CONFIG.COSMERE.skills)[0],
                    choices: () =>
                        Object.entries(CONFIG.COSMERE.skills)
                            .map(([skillId, config]) => [skillId, config.label])
                            .reduce(
                                (acc, [key, value]) => ({
                                    ...acc,
                                    [key]: value,
                                }),
                                {},
                            ),
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifySkillRank}.Skill.Label`,
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifySkillRank}.Amount.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifySkillRank}.Amount.Hint`,
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_MODIFY_SKILL_RANK}`,
        },
        executor: async function (
            this: ModifySkillRankHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.amount === 0) return;

            // Get the actor
            const actor = event.item.actor;

            // Modify the skill rank
            await actor.update(
                {
                    [`system.skills.${this.skill}.rank`]:
                        actor.system.skills[this.skill].rank + this.amount,
                },
                event.op,
            );
        },
    });
}
