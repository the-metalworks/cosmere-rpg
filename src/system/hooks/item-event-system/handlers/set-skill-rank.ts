import { Skill } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/events';

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

// TODO: Localization
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.SetSkillRank,
        label: 'Set Skill Rank',
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
                    label: 'Skill',
                }),
                value: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: 'Value',
                    hint: 'The value to set the skill rank to.',
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
            await actor.update({
                [`system.skills.${this.skill}.rank`]: this.value,
            });
        },
    });
}
