import { ActorType, Skill } from '@system/types/cosmere';
import { ConstructorOf, MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { getSystemSetting, SETTINGS } from '@src/system/settings';
import { CharacterActor } from '@src/system/documents';

// NOTE: Must use a type instead of an interface to match `AnyObject` type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    /**
     * The skill to display
     */
    skill: Skill;

    /**
     * Whether to display the rank pips
     *
     * @default true
     */
    pips?: boolean;

    /**
     * Whether the skill is read-only
     *
     * @default false
     */
    readonly?: boolean;
};

export class ActorSkillComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>,
    Params
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_SKILL}`;

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

    public static onRollSkill(this: ActorSkillComponent, event: Event) {
        event.preventDefault();

        const skillId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as Skill;
        void this.application.actor.rollSkill(skillId);
    }

    public static async onAdjustSkillRank(
        this: ActorSkillComponent,
        event: Event,
    ) {
        event.preventDefault();

        // Check if click is left or right mouse button
        const isLeftClick: boolean = event.type === 'click' ? true : false;
        // Check if the legacy behavior is toggled on
        const shouldIncDec: boolean = getSystemSetting(
            SETTINGS.SHEET_SKILL_INCDEC_TOGGLE,
        );

        // Get skill id
        const skillId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as Skill;

        if (!skillId) return;

        if (!shouldIncDec) {
            // Get the index of the clicked pip
            const rankIndex: number = $(event.currentTarget!).data(
                'index',
            ) as number;
            // Get current skill rank
            const currentRank: number =
                this.application.actor.system.skills[skillId].rank;

            // We want to increase or decrease based on the relative position of the clicked pip to the current rank
            const changeAmount: number = rankIndex + 1 - currentRank;

            // Set the skill rank to the clicked pip, clear the clicked pip, or clear all ranks on rightclick
            await this.application.actor.modifySkillRank(
                skillId,
                isLeftClick ? changeAmount : -999,
            );
        } else {
            // Increment/Decrement the skill rank based on click type
            await this.application.actor.modifySkillRank(skillId, isLeftClick);
        }
    }

    /* --- Accessors --- */

    public get readonly() {
        return this.params?.readonly === true;
    }

    public get pips() {
        return this.params?.pips !== false;
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: BaseActorSheetRenderContext,
    ) {
        // Get skill
        const skill = this.application.actor.system.skills[params.skill];

        // Get skill config
        const config = CONFIG.COSMERE.skills[params.skill];

        let maxSkillRank = 5;
        if (this.application.actor.type === ActorType.Character) {
            const actor = this.application.actor as CharacterActor;
            maxSkillRank = actor.system.maxSkillRank;
        }

        // Get attribute config
        const attributeConfig = CONFIG.COSMERE.attributes[config.attribute];

        return Promise.resolve({
            ...context,

            skill: {
                ...skill,
                id: params.skill,
                label: config.label,
                attribute: config.attribute,
                attributeLabel: attributeConfig.labelShort,
            },

            editable: !this.readonly,
            pips: this.pips,
            maxSkillRank: maxSkillRank,
            legacyMode: getSystemSetting(SETTINGS.SHEET_SKILL_INCDEC_TOGGLE),
        });
    }
}

// Register the component
ActorSkillComponent.register('app-actor-skill');
