/* eslint-disable @typescript-eslint/class-literal-property-style */

import { Attribute, DamageType, Skill } from '@src/system/types/cosmere';
import { RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';
import { CosmereDiceGroup } from '../terms/cosmere-dice-group';
import {
    FixedInstanceType,
    InexactPartial,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { getSystemSetting, SETTINGS } from '@src/system/settings';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export type CosmereDamageRollData = CosmereRollData & {
    skill: Skill;

    attribute: Attribute;

    mod: number;

    type?: DamageType;
};

export interface CosmereDamageRollOptions extends CosmereRollOptions {
    /**
     * Force a skill to be used with this damage roll.
     *
     * @default - If undefined, uses the default skill defined in the damage formula.
     */
    skill?: Skill;

    /**
     * Force an attribute to be used with this damage roll.
     *
     * @default - If undefined, uses the default attribute defined in the damage formula.
     */
    attribute?: Attribute;

    critical?: boolean;
}

export class CosmereDamageRoll extends CosmereRoll {
    public constructor(
        formula: string,
        data: CosmereDamageRollData,
        options: CosmereDamageRollOptions = {},
    ) {
        super(formula, data, options);
    }

    static CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_DAMAGE}`;

    /* --- Accessors --- */
    protected override get icon(): string {
        return this.isHealing ? 'fas fa-heart' : 'fas fa-heart-crack';
    }

    protected override get title(): string {
        return game.i18n.localize(
            this.isHealing ? 'GENERIC.Healing' : 'GENERIC.Damage',
        );
    }

    public override get type(): RollType {
        return RollType.Damage;
    }

    public get hasOpportunity() {
        return false;
    }

    public get hasComplication() {
        return false;
    }

    public get graze(): { total: number; formula: string } | undefined {
        if (!this._evaluated) return undefined;

        const grazeTerms = this.terms.filter(
            (t) => t instanceof CosmereDiceGroup,
        );

        return {
            total: grazeTerms.reduce((total, d) => total + (d.total ?? 0), 0),
            formula: grazeTerms.map((t) => t.formula).join(' + '),
        };
    }

    public get isHealing(): boolean {
        return (this.data as CosmereDamageRollData).type === DamageType.Healing;
    }

    /* --- Functions --- */
    public recalculateMod() {
        const skill =
            this.data.skills[(this.data as CosmereDamageRollData).skill];
        const attribute =
            this.data.attributes[
                (this.data as CosmereDamageRollData).attribute
            ];

        (this.data as CosmereDamageRollData).mod =
            attribute.value + attribute.bonus + skill.rank + skill.mod.bonus;

        this.terms = CosmereDamageRoll.parse(
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
            type: DamageType;
        },
    ): FixedInstanceType<T> {
        const roll = super.fromData(data) as unknown as CosmereDamageRoll;

        (roll.data as CosmereDamageRollData).skill = data.skill;
        (roll.data as CosmereDamageRollData).attribute = data.attribute;
        (roll.data as CosmereDamageRollData).type = data.type;

        return roll as FixedInstanceType<T>;
    }

    public override toJSON() {
        return {
            ...super.toJSON(),
            skill: (this.data as CosmereDamageRollData).skill,
            attribute: (this.data as CosmereDamageRollData).attribute,
            type: (this.data as CosmereDamageRollData).type,
        };
    }

    protected override _prepareTooltipRenderContext() {
        const typeData = this._getDamageTypeData();

        return {
            ...super._prepareTooltipRenderContext(),
            label: typeData?.label,
            icon: typeData?.icon,
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
        const typeData = this._getDamageTypeData();

        return {
            ...super._prepareChatSectionRenderContext(options),
            damageTypes: typeData
                ? `${typeData.label} ${typeData.icon}`
                : undefined,
            critical: (this.options as CosmereDamageRollOptions).critical,
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

        const graze = children.find((r) => r.type === RollType.Graze);
        const bonuses = children.filter((r) => r.type !== RollType.Graze);

        const grazeTooltips: string[] = [];

        grazeTooltips.push(
            graze ? await graze.getTooltip() : await this.getTooltip(),
        );

        for (const bonus of bonuses) {
            grazeTooltips.push(await bonus.getTooltip());
        }

        if (graze) grazeTooltips.push(await graze.getTooltipConstant());

        return {
            ...(await super._prepareChatRenderContext(
                foundry.utils.mergeObject(options ?? {}, { children: bonuses }),
            )),
            critical: (this.options as CosmereDamageRollOptions).critical,
            graze: {
                total:
                    (graze?.total ?? this.graze?.total ?? 0) +
                    bonuses.reduce((sum, child) => sum + (child.total ?? 0), 0),
                formula:
                    (graze?.formula ?? this.graze?.formula ?? '') +
                    (bonuses.length > 0
                        ? ` + ${bonuses.map((r) => r.formula).join(' + ')}`
                        : ''),
                tooltip: grazeTooltips.join(''),
            },
            overlay:
                getSystemSetting(SETTINGS.CHAT_ENABLE_OVERLAY_BUTTONS) &&
                !(this.options as CosmereDamageRollOptions).critical,
            overlayCritImg: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_crit.svg`,
        };
    }

    private _getDamageTypeData() {
        if ((this.data as CosmereDamageRollData).type) {
            const typeLabel = game.i18n.localize(
                CONFIG.COSMERE.damageTypes[
                    (this.data as CosmereDamageRollData).type!
                ].label,
            );
            const typeIcon = `<img src="${CONFIG.COSMERE.damageTypes[(this.data as CosmereDamageRollData).type!].icon}">`;
            return { label: typeLabel, icon: typeIcon };
        } else {
            return undefined;
        }
    }
}
