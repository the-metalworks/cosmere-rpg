import { AttributeGroup, Skill } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    'group-id': AttributeGroup;

    /**
     * Whether or not to display only core skills.
     *
     * @default true
     */
    core?: boolean;
};

export class ActorSkillsGroupComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_SKILLS_GROUP}`;

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: BaseActorSheetRenderContext,
    ) {
        // Get the attribute group config
        const groupConfig = CONFIG.COSMERE.attributeGroups[params['group-id']];

        // Get the skill ids
        const skillIds = groupConfig.attributes
            .map((attrId) => CONFIG.COSMERE.attributes[attrId])
            .map((attr) => attr.skills)
            .flat()
            .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

        return Promise.resolve({
            ...context,

            id: params['group-id'],

            skills: skillIds
                .map((skillId) => {
                    // Get skill
                    const skill = this.application.actor.system.skills[skillId];

                    // Get config
                    const config = CONFIG.COSMERE.skills[skillId];

                    // Get attribute config
                    const attrConfig =
                        CONFIG.COSMERE.attributes[config.attribute];

                    return {
                        id: skillId,
                        config: {
                            ...config,
                            attrLabel: attrConfig.labelShort,
                        },
                        ...skill,
                        active: !config.hiddenUntilAcquired || skill.rank >= 1,
                    };
                })
                .filter((skill) => params.core === false || skill.config.core) // Filter out non-core skills
                .sort((a, b) => {
                    const _a = a.config.hiddenUntilAcquired ? 1 : 0;
                    const _b = b.config.hiddenUntilAcquired ? 1 : 0;
                    return _a - _b;
                }),
        });
    }
}

// Register
ActorSkillsGroupComponent.register('app-actor-skills-group');
