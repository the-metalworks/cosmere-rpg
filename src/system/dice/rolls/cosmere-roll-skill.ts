/* eslint-disable @typescript-eslint/class-literal-property-style */

import { Attribute, Skill } from '@src/system/types/cosmere';
import { AdvantageMode, PlotResultType, RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';
import {
    FixedInstanceType,
    InexactPartial,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { getSystemSetting, SETTINGS } from '@src/system/settings';

export type CosmereSkillRollData = CosmereRollData & {
    skill: Skill;

    attribute: Attribute;

    mod: number;
};

export interface CosmereSkillRollOptions extends CosmereRollOptions {
    /**
     * Force an attribute to be used with this skill roll.
     * Used to roll a skill with an alternate attribute.
     *
     * @default - If undefined, uses the default attribute of the skill.
     */
    attribute?: Attribute;

    raiseStakes?: boolean;

    /**
     * Only used as an initial override for the configuration mode
     * @default AdvantageMode.None
     */
    advantageMode?: AdvantageMode;
}

export class CosmereSkillRoll extends CosmereRoll {
    public constructor(
        formula: string,
        data: CosmereSkillRollData,
        options: CosmereSkillRollOptions = {},
    ) {
        super(formula, data, options);
    }

    static CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_SKILL}`;

    /* --- Accessors --- */
    protected override get icon(): string {
        return 'fa-regular fa-dice-d20';
    }

    protected override get title(): string {
        return game.i18n.localize('GENERIC.SkillTest');
    }

    public override get type(): RollType {
        return RollType.Skill;
    }

    /* --- Functions --- */
    public recalculateMod() {
        const skill =
            this.data.skills[(this.data as CosmereSkillRollData).skill];
        const attribute =
            this.data.attributes[(this.data as CosmereSkillRollData).attribute];

        (this.data as CosmereSkillRollData).mod =
            attribute.value + attribute.bonus + skill.rank + skill.mod.bonus;

        this.terms = CosmereSkillRoll.parse(
            this.data.parts?.join(' + ') ?? this.formula,
            this.data,
        );
        this._formula = this.resetFormula();
        this._prepared = false;
    }

    public static override fromData<T extends Roll.Internal.AnyConstructor>(
        this: T,
        data: Roll.Data & {
            uuid: string;
            prepared: boolean;
            hidden: boolean;
            parent: string;
            skill: Skill;
            attribute: Attribute;
        },
    ): FixedInstanceType<T> {
        const roll = super.fromData(data) as unknown as CosmereSkillRoll;

        (roll.data as CosmereSkillRollData).skill = data.skill;
        (roll.data as CosmereSkillRollData).attribute = data.attribute;

        return roll as FixedInstanceType<T>;
    }

    public override toJSON() {
        return {
            ...super.toJSON(),
            skill: (this.data as CosmereSkillRollData).skill,
            attribute: (this.data as CosmereSkillRollData).attribute,
        };
    }

    protected override _prepareChatSectionRenderContext(
        options?:
            | InexactPartial<{
                  flavor: string;
                  isPrivate: boolean;
                  children: CosmereRoll[];
              }>
            | undefined,
    ) {
        return {
            ...super._prepareChatSectionRenderContext(options),
            subtitle: {
                skill: (this.data as CosmereSkillRollData).skill
                    ? CONFIG.COSMERE.skills[
                          (this.data as CosmereSkillRollData).skill
                      ].label
                    : `${game.i18n.localize('GENERIC.Custom')} ${game.i18n.localize('GENERIC.Skill')}`,
                attribute: (this.data as CosmereSkillRollData).attribute
                    ? CONFIG.COSMERE.attributes[
                          (this.data as CosmereSkillRollData).attribute
                      ].labelShort
                    : game.i18n?.localize('GENERIC.None'),
            },
        };
    }

    protected override async _prepareChatRenderContext(
        options?:
            | InexactPartial<{
                  flavor: string;
                  isPrivate: boolean;
                  children: CosmereRoll[];
              }>
            | undefined,
    ) {
        const children = options?.children ?? [];
        const childrenTotal = children.reduce(
            (sum, child) => sum + (child.total ?? 0),
            0,
        );
        const childrenOpportunities = children.reduce(
            (sum, child) => sum + (child.opportunityCount ?? 0),
            0,
        );
        const childrenComplications = children.reduce(
            (sum, child) => sum + (child.complicationCount ?? 0),
            0,
        );

        const entries = [];

        for (const die of this.dice) {
            for (const result of die.results) {
                const opportunityCount =
                    (result.result >= die.opportunityRange ? 1 : 0) +
                    childrenOpportunities;
                const complicationCount =
                    (result.result <= die.complicationRange ? 1 : 0) +
                    childrenComplications;

                const plotResults = new Array(
                    opportunityCount + complicationCount,
                );
                plotResults.fill(
                    PlotResultType.Opportunity,
                    0,
                    opportunityCount,
                );
                plotResults.fill(PlotResultType.Complication, opportunityCount);

                entries.push({
                    total: result.result + this.constant + childrenTotal,
                    ignored: result.discarded,
                    plotResults,
                    plotType:
                        opportunityCount > 0
                            ? PlotResultType.Opportunity
                            : complicationCount > 0
                              ? PlotResultType.Complication
                              : undefined,
                });
            }
        }

        return {
            ...(await super._prepareChatRenderContext(options)),
            entries,
            overlay:
                getSystemSetting(SETTINGS.CHAT_ENABLE_OVERLAY_BUTTONS) &&
                entries.length === 1,
            overlayAdvImg: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_adv.svg`,
            overlayDisImg: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_dis.svg`,
        };
    }
}
