import { Skill } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import {
    AdversarySheet,
    AdversarySheetRenderContext,
} from '../../adversary-sheet';
import { ConfigureSkillsDialog } from '../../dialogs/configure-skills';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    skillsCollapsed: boolean;
};

export class AdversarySkillsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<AdversarySheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_ADVERSARY_SKILLS}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-collapsed': this.onToggleCollapsed,
        'roll-skill': this.onRollSkill,
        'toggle-skills-collapsed': this.onToggleSkillsCollapsed,
        'configure-skills': this.onConfigureSkills,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private sectionCollapsed = false;

    /* --- Actions --- */

    public static onRollSkill(this: AdversarySkillsComponent, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const skillId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as Skill;
        void this.application.actor.rollSkill(skillId);
    }

    private static onToggleCollapsed(this: AdversarySkillsComponent) {
        this.sectionCollapsed = !this.sectionCollapsed;
    }

    private static onToggleSkillsCollapsed(
        this: AdversarySkillsComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        // Update the flag
        void this.application.actor.setFlag(
            SYSTEM_ID,
            'sheet.skillsCollapsed',
            !this.application.areSkillsCollapsed,
        );
    }

    private static onConfigureSkills(
        this: AdversarySkillsComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        void ConfigureSkillsDialog.show(this.application.actor);
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: AdversarySheetRenderContext,
    ) {
        // Get the skill ids
        const skillIds = Object.keys(CONFIG.COSMERE.skills).sort((a, b) =>
            a.localeCompare(b),
        ) as Skill[]; // Sort alphabetically

        // Get skills
        const skills = skillIds
            .map((skillId) => {
                const skillConfig = CONFIG.COSMERE.skills[skillId];

                return {
                    id: skillId,
                    config: skillConfig,
                    attributeLabel:
                        CONFIG.COSMERE.attributes[skillConfig.attribute].label,
                    ...this.application.actor.system.skills[skillId],
                    active:
                        (!skillConfig.hiddenUntilAcquired &&
                            !this.application.areSkillsCollapsed) ||
                        this.application.actor.system.skills[skillId].rank >= 1,
                };
            })
            .sort((a, b) => {
                const _a = a.config.hiddenUntilAcquired ? 1 : 0;
                const _b = b.config.hiddenUntilAcquired ? 1 : 0;
                return _a - _b;
            });

        return Promise.resolve({
            ...context,

            skillsCollapsed: this.application.areSkillsCollapsed,
            skills,
            hasActiveSkills: skills.some((skill) => skill.active),
        });
    }

    /* --- Lifecycle --- */

    protected _onRender(params: Params): void {
        super._onRender(params);

        $(this.element!)
            .find('.collapsible .icon-header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
    }
}

// Register
AdversarySkillsComponent.register('app-adversary-skills');
