import { AttributeGroup, Skill } from '@system/types/cosmere';
import { ConstructorOf, MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import {
    AdversarySheet,
    AdversarySheetRenderContext,
} from '../../adversary-sheet';
import { getSystemSetting, SETTINGS } from '@src/system/settings';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    'group-id': AttributeGroup;
    collapsed: boolean;
};

export class AdversarySkillsGroupComponent extends HandlebarsApplicationComponent<
    ConstructorOf<AdversarySheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_ADVERSARY_SKILLS_GROUP}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'roll-skill': this.onRollSkill,
        'adjust-skill-rank': {
            handler: this.onAdjustSkillRank,
            buttons: [MouseButton.Primary, MouseButton.Secondary],
        },
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    public static onRollSkill(
        this: AdversarySkillsGroupComponent,
        event: Event,
    ) {
        event.preventDefault();

        const skillId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as Skill;
        void this.application.actor.rollSkill(skillId);
    }

    public static async onAdjustSkillRank(
        this: AdversarySkillsGroupComponent,
        event: Event,
    ) {
        event.preventDefault();

        // Check if click is left or right mouse button
        const incrementBool: boolean = event.type === 'click' ? true : false;
        // Check if the legacy behavior is toggled on
        const shouldIncDec: boolean = getSystemSetting(
            SETTINGS.SHEET_SKILL_INCDEC_TOGGLE,
        );

        // Get skill id
        const skillId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as Skill;

        if (!shouldIncDec) {
            // Get the index of the clicked pip
            const rankIndex: number = $(event.currentTarget!).data(
                'index',
            ) as number;
            // Get current skill rank
            const currentRank: number =
                this.application.actor.system.skills[skillId].rank;
            // Determine if rank and pip clicked match
            const isSameRank: boolean = currentRank == rankIndex + 1;
            // We want to decrement by 1 if they match, otherwise increase by the difference between clicked ranks
            const changeAmount: number = isSameRank
                ? -1
                : rankIndex + 1 - currentRank;

            // Set the skill rank to the clicked pip, clear the clicked pip, or clear all ranks on rightclick
            await this.application.actor.modifySkillRank(
                skillId,
                incrementBool ? changeAmount : -999,
                false,
            );
        } else {
            // Increment/Decrement the skill rank based on click type
            await this.application.actor.modifySkillRank(
                skillId,
                incrementBool,
                false,
            );
        }

        // Only re-render this component
        void this.render();
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: AdversarySheetRenderContext,
    ) {
        // Get the attribute group config
        const groupConfig = CONFIG.COSMERE.attributeGroups[params['group-id']];

        // Get the skill ids
        const skillIds = groupConfig.attributes
            .map((attrId) => CONFIG.COSMERE.attributes[attrId])
            .map((attr) => attr.skills)
            .flat()
            .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

        // Get skills
        const skills = skillIds
            .map((skillId) => ({
                id: skillId,
                config: CONFIG.COSMERE.skills[skillId],
                ...this.application.actor.system.skills[skillId],
                active:
                    (!CONFIG.COSMERE.skills[skillId].hiddenUntilAcquired &&
                        !params.collapsed) ||
                    this.application.actor.system.skills[skillId].rank >= 1,
            }))
            .sort((a, b) => {
                const _a = a.config.hiddenUntilAcquired ? 1 : 0;
                const _b = b.config.hiddenUntilAcquired ? 1 : 0;
                return _a - _b;
            });

        return Promise.resolve({
            ...context,

            id: params['group-id'],
            collapsed: params.collapsed,
            skills,
            hasActiveSkills: skills.some((skill) => skill.active),
        });
    }
}

// Register
AdversarySkillsGroupComponent.register('app-adversary-skills-group');
