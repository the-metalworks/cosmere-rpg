import { Skill } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/event-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface SetSkillRankHandlerConfigData {
    /**
     * The skill to set
     */
    skill: Skill;

    /**
     * The value to set the skill rank to
     */
    value: number;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.SetSkillRank,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetSkillRank}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetSkillRank}.Description`,
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
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetSkillRank}.Skill.Label`,
                }),
                value: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetSkillRank}.Value.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetSkillRank}.Value.Hint`,
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_SET_SKILL_RANK}`,
        },
        executor: async function (
            this: SetSkillRankHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.value === 0) return;

            // Get the actor
            const actor = event.item.actor;

            // Set the skill rank
            await actor.update(
                {
                    [`system.skills.${this.skill}.rank`]: this.value,
                },
                event.op,
            );
        },
    });
}
