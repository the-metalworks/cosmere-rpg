import { Skill } from '@system/types/cosmere';
import { AnyObject, ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import {
    AdversarySheet,
    AdversarySheetRenderContext,
} from '../../adversary-sheet';
import { ConfigureSkillsDialog } from '../../dialogs/configure-skills';

export class AdversarySkillsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<AdversarySheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_ADVERSARY_SKILLS}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'roll-skill': this.onRollSkill,
        'toggle-hide-unranked': this.onToggleHideUnranked,
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

    private static onToggleHideUnranked(
        this: AdversarySkillsComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        // Update the flag
        void this.application.actor.setFlag(
            SYSTEM_ID,
            'sheet.hideUnranked',
            !this.application.hideUnrankedSkills,
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
        params: never,
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
                            !this.application.hideUnrankedSkills) ||
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

            sectionCollapsed: this.sectionCollapsed,
            hideUnranked: this.application.hideUnrankedSkills,
            skills,
            hasActiveSkills: skills.some((skill) => skill.active),
        });
    }

    /* --- Lifecycle --- */

    protected _onInitialize(params: AnyObject): void {
        super._onInitialize(params);
        this.sectionCollapsed = this.application.areSkillsCollapsed;
    }

    protected _onRender(params: AnyObject): void {
        super._onRender(params);

        $(this.element!)
            .find('.collapsible .icon-header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    protected _onDestroy(): void {
        // Setting a flag causes a document update and therefore a re-render.
        // We don't want to re-render every time we collapse a section because it breaks transitions.
        // This flag is therefore only stored once at the end when closing the document so that
        // it is available in the correct state when we next open the document and reinitialize this component.
        void this.application.actor.setFlag(
            SYSTEM_ID,
            'sheet.skillsCollapsed',
            this.sectionCollapsed,
        );

        super._onDestroy();
    }

    /* --- Event handlers --- */
    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
        this.sectionCollapsed = !this.sectionCollapsed;
    }
}

// Register
AdversarySkillsComponent.register('app-adversary-skills');
