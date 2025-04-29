import {
    Size,
    CreatureType,
    Condition,
    InjuryType,
    AttributeGroup,
    Attribute,
    Skill,
    Resource,
    WeaponType,
    WeaponId,
    ArmorId,
    ExpertiseType,
    WeaponTraitId,
    ArmorTraitId,
    AdversaryRole,
    DeflectSource,
    ActivationType,
    ItemConsumeType,
    ActionType,
    ActionCostType,
    AttackType,
    DamageType,
    ItemType,
    ItemRechargeType,
    ItemUseType,
    EquipType,
    HoldType,
    EquipHand,
    PathType,
    EquipmentType,
    PowerType,
    Theme,
    MovementType,
} from './cosmere';
import { AdvantageMode } from './roll';

import { Talent, TalentTree, Goal, Events as ItemEvents } from './item';

export interface SizeConfig {
    label: string;
    size?: number;
    unit?: string;
}

export interface CreatureTypeConfig {
    label: string;
}

export interface ConditionConfig {
    label: string;
    icon: string;
    reference?: string;

    /**
     * Whether the condition is stackable.
     */
    stackable?: boolean;

    /**
     * Transform the `stacks` value for display.
     *
     * @example Used for exhaustion to display "Exhaustion [-1]" instead of "Exhaution [1]".
     */
    stacksDisplayTransform?: (count: number) => string;
}

export interface InjuryConfig {
    label: string;
    durationFormula?: string;
}

export interface AttributeGroupConfig {
    key: string;
    label: string;
    attributes: [Attribute, Attribute];
    resource: Resource;
}

export interface AttributeConfig {
    key: string;
    label: string;
    labelShort: string;
    skills: Skill[];
}

export interface SkillConfig {
    key: string;
    label: string;
    attribute: Attribute;

    /**
     * Whether the skill is a core skill.
     * Core skills are visible in the skill list on the character sheet.
     */
    core?: boolean;

    // TODO: Replace
    hiddenUntilAcquired?: boolean;
}

export interface ResourceConfig {
    key: string;
    label: string;
    deflect?: boolean;

    /**
     * The formula used to derive the max value
     */
    formula?: string;
}

export interface PathTypeConfig {
    label: string;
}

export interface CurrencyConfig {
    label: string;
    icon: string | undefined;
    denominations: {
        primary: CurrencyDenominationConfig[];
        secondary?: CurrencyDenominationConfig[];
    };
}

export interface CurrencyDenominationConfig {
    id: string;
    label: string;
    conversionRate: number; // Value relative to base denomination
    base?: boolean; // Present if this denomination is considered the base
    unit?: string; // Present for the base denomination
}

export interface WeaponTypeConfig {
    label: string;
}

export interface WeaponConfig {
    label: string;
    reference: string;
    specialExpertise?: boolean;
}

export interface ArmorConfig {
    label: string;
    reference: string;
    specialExpertise?: boolean;
}

export interface ExpertiseTypeConfig {
    label: string;
    icon?: string;
}

export interface TraitConfig {
    label: string;
    reference?: string;
    hasValue?: boolean;
}

export interface AdversaryRoleConfig {
    label: string;
}

export interface DeflectSourceConfig {
    label: string;
}

export interface ActivationTypeConfig {
    label: string;
}

export interface ItemUseTypeConfig {
    label: string;
    labelPlural: string;
}

export interface ItemConsumeTypeConfig {
    label: string;
}

export interface ItemRechargeConfig {
    label: string;
}

export interface ActionTypeConfig {
    label: string;
    labelPlural: string;
    subtitle?: string;
    hasMode?: boolean;
}

export interface ActionCostConfig {
    label: string;
    icon?: string;
}

export interface AttackTypeConfig {
    label: string;
}

export interface DamageTypeConfig {
    label: string;
    icon?: string;
    ignoreDeflect?: boolean;
}

export interface ItemTypeConfig {
    label: string;
    labelPlural: string;
    desc_placeholder?: string;
}

export interface EquipTypeConfig {
    label: string;
}

export interface HoldTypeConfig {
    label: string;
}

export interface EquipHandConfig {
    label: string;
}

export interface CultureConfig {
    label: string;
    reference?: string;
}

export interface AncestriesConfig {
    label: string;
    reference?: string;
}

export interface EquipmentTypeConfig {
    label: string;
}

export interface TalentTypeConfig {
    label: string;
}

export interface PowerTypeConfig {
    label: string;
    plural: string;
}

export interface AdvancementRuleConfig {
    /**
     * The level at which this rule applies.
     */
    level: number;

    /**
     * The tier the level falls into.
     */
    tier: number;

    /**
     * The maximum number of skill ranks that can be acquired for any
     * given skill at this level.
     */
    maxSkillRanks: number;

    /**
     * The amount of attribute points granted at this level.
     */
    attributePoints?: number;

    /**
     * The amount of health granted at this level.
     */
    health?: number;

    /**
     * Whether to include the strength attribute in the health granted.
     *
     * @default false
     */
    healthIncludeStrength?: boolean;

    /**
     * The amount of skill ranks granted at this level.
     */
    skillRanks?: number;

    /**
     * The amount of talents granted at this level.
     */
    talents?: number;

    /**
     * The amount of skill ranks OR talents granted at this level.
     * This is used when the character must choose between skill ranks and talents.
     */
    skillRanksOrTalents?: number;
}

export type AttributeScale<T extends string = string> = {
    formula: T;
} & (
    | {
          min: number;
          max: number;
      }
    | {
          value: number;
      }
);

export interface MovementTypeConfig {
    label: string;
}

export interface HandlerTypeConfig {
    label: string;
    documentClass: ItemEvents.HandlerCls;
}

export interface CosmereRPGConfig {
    themes: Record<Theme, string>;
    sizes: Record<Size, SizeConfig>;
    creatureTypes: Record<CreatureType, CreatureTypeConfig>;
    movement: {
        types: Record<MovementType, MovementTypeConfig>;
    };
    conditions: Record<Condition, ConditionConfig>;
    injury: {
        types: Record<InjuryType, InjuryConfig>;
        durationTable: string;
    };

    attributeGroups: Record<AttributeGroup, AttributeGroupConfig>;
    attributes: Record<Attribute, AttributeConfig>;
    resources: Record<Resource, ResourceConfig>;
    skills: Record<Skill, SkillConfig>;
    advancement: {
        rules: AdvancementRuleConfig[];
    };

    currencies: Record<string, CurrencyConfig>;

    paths: {
        types: Record<PathType, PathTypeConfig>;
    };

    items: {
        types: Record<ItemType, ItemTypeConfig>;
        activation: {
            types: Record<ActivationType, ActivationTypeConfig>;
            consumeTypes: Record<ItemConsumeType, ItemConsumeTypeConfig>;
            uses: {
                types: Record<ItemUseType, ItemUseTypeConfig>;
                recharge: Record<ItemRechargeType, ItemRechargeConfig>;
            };
        };
        equip: {
            types: Record<EquipType, EquipTypeConfig>;
            hold: Record<HoldType, HoldTypeConfig>;
            hand: Record<EquipHand, EquipHandConfig>;
        };

        equipment: {
            types: Record<EquipmentType, EquipmentTypeConfig>;
        };

        goal: {
            rewards: {
                types: Record<Goal.Reward.Type, string>;
            };
        };

        talent: {
            types: Record<Talent.Type, TalentTypeConfig>;
            grantRules: {
                types: Record<Talent.GrantRule.Type, string>;
            };
        };

        talentTree: {
            node: {
                prerequisite: {
                    types: Record<TalentTree.Node.Prerequisite.Type, string>;
                };
            };
        };

        events: {
            handlers: Record<string, HandlerTypeConfig>;
        };
    };

    weaponTypes: Record<WeaponType, WeaponTypeConfig>;
    weapons: Record<WeaponId, WeaponConfig>;
    armors: Record<ArmorId, ArmorConfig>;
    expertiseTypes: Record<ExpertiseType, ExpertiseTypeConfig>;

    traits: {
        weaponTraits: Record<WeaponTraitId, TraitConfig>;
        armorTraits: Record<ArmorTraitId, TraitConfig>;
    };

    adversary: {
        roles: Record<AdversaryRole, AdversaryRoleConfig>;
    };

    deflect: {
        sources: Record<DeflectSource, DeflectSourceConfig>;
    };

    action: {
        types: Record<ActionType, ActionTypeConfig>;
        costs: Record<ActionCostType, ActionCostConfig>;
    };

    attack: {
        types: Record<AttackType, AttackTypeConfig>;
    };

    power: {
        types: Record<PowerType, PowerTypeConfig>;
    };

    damageTypes: Record<DamageType, DamageTypeConfig>;

    cultures: Record<string, CultureConfig>;
    ancestries: Record<string, AncestriesConfig>;

    units: {
        weight: string[];
        distance: Record<string, string>;
    };

    dice: {
        advantageModes: Record<AdvantageMode, string>;
    };

    scaling: {
        damage: {
            unarmed: {
                strength: AttributeScale[];
            };
        };
        power: {
            die: {
                ranks: AttributeScale[];
            };
            effectSize: {
                ranks: AttributeScale<Size>[];
            };
        };
    };
}
