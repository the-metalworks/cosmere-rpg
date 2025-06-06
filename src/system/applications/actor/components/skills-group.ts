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
    /**
     * The attribute group id to display skills for.
     */
    'group-id'?: AttributeGroup;

    /**
     * Whether or not to display only core skills.
     *
     * @default true
     */
    core?: boolean;

    /**
     * Explicit list of skills to display.
     * If provided, this will override the skills in the group and the `core` flag.
     */
    skills?: Skill[];
};

export class ActorSkillsGroupComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_SKILLS_GROUP}`;

    /* --- Accessors --- */

    get skillIds(): Skill[] {
        if (this.params?.skills) {
            return this.params.skills;
        } else {
            // Ensure group-id is provided
            if (!this.params?.['group-id'])
                throw new Error(
                    'ActorSkillsGroupComponent: No group-id provided.',
                );

            // Get the group id from params
            const groupId = this.params['group-id'];

            // Get the attribute group config
            const groupConfig = CONFIG.COSMERE.attributeGroups[groupId];

            // Get the skill ids
            const skillIds = groupConfig.attributes
                .map((attrId) => CONFIG.COSMERE.attributes[attrId])
                .map((attr) => attr.skills)
                .flat()
                .filter(
                    (skillId) =>
                        this.params!.core === false ||
                        CONFIG.COSMERE.skills[skillId].core,
                )
                .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

            return skillIds;
        }
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            id: params['group-id'],

            skills: this.skillIds
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
