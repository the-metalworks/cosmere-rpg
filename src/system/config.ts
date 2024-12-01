// Types
import { CosmereRPGConfig } from './types/config';
import {
    Size,
    CreatureType,
    Condition,
    InjuryType,
    Attribute,
    AttributeGroup,
    Resource,
    Skills,
    WeaponType,
    WeaponId,
    ExpertiseType,
    WeaponTraitId,
    ArmorTraitId,
    AdversaryRole,
    DeflectSource,
    ActivationType,
    ItemConsumeType,
    ActionType,
    ActionCostType,
    DamageType,
    ItemType,
    AttackType,
    ItemRechargeType,
    ItemUseType,
    EquipType,
    HoldType,
    PathType,
    EquipHand,
    EquipmentType,
    PowerType,
    Theme,
} from './types/cosmere';
import { AdvantageMode } from './types/roll';

import { Talent, Goal } from './types/item';

const COSMERE: CosmereRPGConfig = {
    sizes: {
        [Size.Small]: {
            label: 'COSMERE.Actor.Size.Small',
            size: 2.5,
            unit: 'feet',
        },
        [Size.Medium]: {
            label: 'COSMERE.Actor.Size.Medium',
            size: 5,
            unit: 'feet',
        },
        [Size.Large]: {
            label: 'COSMERE.Actor.Size.Large',
            size: 10,
            unit: 'feet',
        },
        [Size.Huge]: {
            label: 'COSMERE.Actor.Size.Huge',
            size: 15,
            unit: 'feet',
        },
        [Size.Garguantuan]: {
            label: 'COSMERE.Actor.Size.Gargantuan',
            size: 20,
            unit: 'feet',
        },
    },
    creatureTypes: {
        [CreatureType.Custom]: {
            label: 'COSMERE.Actor.Type.Custom',
        },
        [CreatureType.Humanoid]: {
            label: 'COSMERE.Actor.Type.Humanoid',
        },
        [CreatureType.Animal]: {
            label: 'COSMERE.Actor.Type.Animal',
        },
    },

    themes: {
        [Theme.Default]: 'COSMERE.Theme.Default',
        [Theme.Stormlight]: 'COSMERE.Theme.Stormlight',
    },

    conditions: {
        [Condition.Afflicted]: {
            label: 'COSMERE.Conditions.Afflicted',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/afflicted.svg',
        },
        [Condition.Determined]: {
            label: 'COSMERE.Conditions.Determined',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/determined.svg',
        },
        [Condition.Disoriented]: {
            label: 'COSMERE.Conditions.Disoriented',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/disoriented.svg',
        },
        [Condition.Empowered]: {
            label: 'COSMERE.Conditions.Empowered',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/empowered.svg',
        },
        [Condition.Encumbered]: {
            label: 'COSMERE.Conditions.Encumbered',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/encumbered.svg',
        },
        [Condition.Enhanced]: {
            label: 'COSMERE.Conditions.Enhanced',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/enhanced.svg',
        },
        [Condition.Exhausted]: {
            label: 'COSMERE.Conditions.Exhausted',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/exhausted.svg',
        },
        [Condition.Focused]: {
            label: 'COSMERE.Conditions.Focused',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/focused.svg',
        },
        [Condition.Immobilized]: {
            label: 'COSMERE.Conditions.Immobilized',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/immobilized.svg',
        },
        [Condition.Prone]: {
            label: 'COSMERE.Conditions.Prone',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/prone.svg',
        },
        [Condition.Restrained]: {
            label: 'COSMERE.Conditions.Restrained',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/restrained.svg',
        },
        [Condition.Slowed]: {
            label: 'COSMERE.Conditions.Slowed',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/slowed.svg',
        },
        [Condition.Stunned]: {
            label: 'COSMERE.Conditions.Stunned',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/stunned.svg',
        },
        [Condition.Surprised]: {
            label: 'COSMERE.Conditions.Surprised',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/surprised.svg',
        },
        [Condition.Unconcious]: {
            label: 'COSMERE.Conditions.Unconscious',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/unconscious.svg',
        },
    },

    injury: {
        types: {
            [InjuryType.FleshWound]: {
                label: 'COSMERE.Item.Injuries.Duration.FleshWound',
                durationFormula: '1',
            },
            [InjuryType.ShallowInjury]: {
                label: 'COSMERE.Item.Injuries.Duration.ShallowInjury',
                durationFormula: '1d6',
            },
            [InjuryType.ViciousInjury]: {
                label: 'COSMERE.Item.Injuries.Duration.ViciousInjury',
                durationFormula: '6d6',
            },
            [InjuryType.PermanentInjury]: {
                label: 'COSMERE.Item.Injuries.Duration.PermanentInjury',
            },
            [InjuryType.Death]: {
                label: 'COSMERE.Item.Injuries.Duration.Death',
            },
        },
        durationTable:
            'Compendium.cosmere-rpg.tables.RollTable.qOXZSTYaP6jhnvBV',
    },

    attributeGroups: {
        [AttributeGroup.Physical]: {
            key: AttributeGroup.Physical,
            label: 'COSMERE.AttributeGroup.Physical.long',
            attributes: [Attribute.Strength, Attribute.Speed],
            resource: Resource.Health,
        },
        [AttributeGroup.Cognitive]: {
            key: AttributeGroup.Cognitive,
            label: 'COSMERE.AttributeGroup.Cognitive.long',
            attributes: [Attribute.Intellect, Attribute.Willpower],
            resource: Resource.Focus,
        },
        [AttributeGroup.Spiritual]: {
            key: AttributeGroup.Spiritual,
            label: 'COSMERE.AttributeGroup.Spiritual.long',
            attributes: [Attribute.Awareness, Attribute.Presence],
            resource: Resource.Investiture,
        },
    },

    attributes: {
        [Attribute.Strength]: {
            key: Attribute.Strength,
            label: 'COSMERE.Actor.Attribute.Strength.long',
            labelShort: 'COSMERE.Actor.Attribute.Strength.short',
            skills: [Skills.Athletics, Skills.HeavyWeapons],
        },
        [Attribute.Speed]: {
            key: Attribute.Speed,
            label: 'COSMERE.Actor.Attribute.Speed.long',
            labelShort: 'COSMERE.Actor.Attribute.Speed.short',
            skills: [
                Skills.Agility,
                Skills.LightWeapons,
                Skills.Stealth,
                Skills.Thievery,
            ],
        },
        [Attribute.Intellect]: {
            key: Attribute.Intellect,
            label: 'COSMERE.Actor.Attribute.Intellect.long',
            labelShort: 'COSMERE.Actor.Attribute.Intellect.short',
            skills: [
                Skills.Crafting,
                Skills.Deduction,
                Skills.Lore,
                Skills.Medicine,
            ],
        },
        [Attribute.Willpower]: {
            key: Attribute.Willpower,
            label: 'COSMERE.Actor.Attribute.Willpower.long',
            labelShort: 'COSMERE.Actor.Attribute.Willpower.short',
            skills: [Skills.Discipline, Skills.Intimidation],
        },
        [Attribute.Awareness]: {
            key: Attribute.Awareness,
            label: 'COSMERE.Actor.Attribute.Awareness.long',
            labelShort: 'COSMERE.Actor.Attribute.Awareness.short',
            skills: [Skills.Insight, Skills.Perception, Skills.Survival],
        },
        [Attribute.Presence]: {
            key: Attribute.Presence,
            label: 'COSMERE.Actor.Attribute.Presence.long',
            labelShort: 'COSMERE.Actor.Attribute.Presence.short',
            skills: [Skills.Deception, Skills.Leadership, Skills.Persuasion],
        },
    },

    resources: {
        [Resource.Health]: {
            key: Resource.Health,
            label: 'COSMERE.Actor.Resource.Health',
            deflect: true,
            formula: '10 + @attr.str + @bonus',
        },
        [Resource.Focus]: {
            key: Resource.Health,
            label: 'COSMERE.Actor.Resource.Focus',
            formula: '2 + @attr.wil + @bonus',
        },
        [Resource.Investiture]: {
            key: Resource.Health,
            label: 'COSMERE.Actor.Resource.Investiture',
        },
    },

    skills: {
        [Skills.Agility]: {
            key: Skills.Agility,
            label: 'COSMERE.Actor.Skill.Agility',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skills.Athletics]: {
            key: Skills.Athletics,
            label: 'COSMERE.Actor.Skill.Athletics',
            attribute: Attribute.Strength,
            core: true,
        },
        [Skills.HeavyWeapons]: {
            key: Skills.HeavyWeapons,
            label: 'COSMERE.Actor.Skill.HeavyWeapons',
            attribute: Attribute.Strength,
            core: true,
        },
        [Skills.LightWeapons]: {
            key: Skills.LightWeapons,
            label: 'COSMERE.Actor.Skill.LightWeapons',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skills.Stealth]: {
            key: Skills.Stealth,
            label: 'COSMERE.Actor.Skill.Stealth',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skills.Thievery]: {
            key: Skills.Thievery,
            label: 'COSMERE.Actor.Skill.Thievery',
            attribute: Attribute.Speed,
            core: true,
        },

        [Skills.Crafting]: {
            key: Skills.Crafting,
            label: 'COSMERE.Actor.Skill.Crafting',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skills.Deduction]: {
            key: Skills.Deduction,
            label: 'COSMERE.Actor.Skill.Deduction',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skills.Discipline]: {
            key: Skills.Discipline,
            label: 'COSMERE.Actor.Skill.Discipline',
            attribute: Attribute.Willpower,
            core: true,
        },
        [Skills.Intimidation]: {
            key: Skills.Intimidation,
            label: 'COSMERE.Actor.Skill.Intimidation',
            attribute: Attribute.Willpower,
            core: true,
        },
        [Skills.Lore]: {
            key: Skills.Lore,
            label: 'COSMERE.Actor.Skill.Lore',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skills.Medicine]: {
            key: Skills.Medicine,
            label: 'COSMERE.Actor.Skill.Medicine',
            attribute: Attribute.Intellect,
            core: true,
        },

        [Skills.Deception]: {
            key: Skills.Deception,
            label: 'COSMERE.Actor.Skill.Deception',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skills.Insight]: {
            key: Skills.Insight,
            label: 'COSMERE.Actor.Skill.Insight',
            attribute: Attribute.Awareness,
            core: true,
        },
        [Skills.Leadership]: {
            key: Skills.Leadership,
            label: 'COSMERE.Actor.Skill.Leadership',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skills.Perception]: {
            key: Skills.Perception,
            label: 'COSMERE.Actor.Skill.Perception',
            attribute: Attribute.Awareness,
            core: true,
        },
        [Skills.Persuasion]: {
            key: Skills.Persuasion,
            label: 'COSMERE.Actor.Skill.Persuasion',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skills.Survival]: {
            key: Skills.Survival,
            label: 'COSMERE.Actor.Skill.Survival',
            attribute: Attribute.Awareness,
            core: true,
        },
    },

    paths: {
        types: {
            [PathType.Heroic]: {
                label: 'COSMERE.Paths.Types.Heroic.Label',
            },
        },
    },

    items: {
        types: {
            [ItemType.Weapon]: {
                label: 'COSMERE.Item.Type.Weapon.label',
                labelPlural: 'COSMERE.Item.Type.Weapon.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Weapon.desc_placeholder',
            },
            [ItemType.Armor]: {
                label: 'COSMERE.Item.Type.Armor.label',
                labelPlural: 'COSMERE.Item.Type.Armor.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Armor.desc_placeholder',
            },
            [ItemType.Equipment]: {
                label: 'COSMERE.Item.Type.Equipment.label',
                labelPlural: 'COSMERE.Item.Type.Equipment.label_plural',
                desc_placeholder:
                    'COSMERE.Item.Type.Equipment.desc_placeholder',
            },
            [ItemType.Loot]: {
                label: 'COSMERE.Item.Type.Loot.label',
                labelPlural: 'COSMERE.Item.Type.Loot.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Loot.desc_placeholder',
            },
            [ItemType.Ancestry]: {
                label: 'COSMERE.Item.Type.Ancestry.label',
                labelPlural: 'COSMERE.Item.Type.Ancestry.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Ancestry.desc_placeholder',
            },
            [ItemType.Culture]: {
                label: 'COSMERE.Item.Type.Culture.label',
                labelPlural: 'COSMERE.Item.Type.Culture.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Culture.desc_placeholder',
            },
            [ItemType.Path]: {
                label: 'COSMERE.Item.Type.Path.label',
                labelPlural: 'COSMERE.Item.Type.Path.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Path.desc_placeholder',
            },
            [ItemType.Specialty]: {
                label: 'COSMERE.Item.Type.Specialty.label',
                labelPlural: 'COSMERE.Item.Type.Specialty.label_plural',
                desc_placeholder:
                    'COSMERE.Item.Type.Specialty.desc_placeholder',
            },
            [ItemType.Talent]: {
                label: 'COSMERE.Item.Type.Talent.label',
                labelPlural: 'COSMERE.Item.Type.Talent.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Talent.desc_placeholder',
            },
            [ItemType.Action]: {
                label: 'COSMERE.Item.Type.Action.label',
                labelPlural: 'COSMERE.Item.Type.Action.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Action.desc_placeholder',
            },
            [ItemType.Trait]: {
                label: 'COSMERE.Item.Type.Trait.label',
                labelPlural: 'COSMERE.Item.Type.Trait.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Trait.desc_placeholder',
            },
            [ItemType.Injury]: {
                label: 'COSMERE.Item.Type.Injury.label',
                labelPlural: 'COSMERE.Item.Type.Injury.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Injury.desc_placeholder',
            },
            [ItemType.Connection]: {
                label: 'COSMERE.Item.Type.Connection.label',
                labelPlural: 'COSMERE.Item.Type.Connection.label_plural',
                desc_placeholder:
                    'COSMERE.Item.Type.Connection.desc_placeholder',
            },
            [ItemType.Goal]: {
                label: 'COSMERE.Item.Type.Goal.label',
                labelPlural: 'COSMERE.Item.Type.Goal.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Goal.desc_placeholder',
            },
            [ItemType.Power]: {
                label: 'COSMERE.Item.Type.Power.label',
                labelPlural: 'COSMERE.Item.Type.Power.label_plural',
                desc_placeholder: 'COSMERE.Item.Type.Power.desc_placeholder',
            },
            [ItemType.TalentTree]: {
                label: 'COSMERE.Item.Type.TalentTree.label',
                labelPlural: 'COSMERE.Item.Type.TalentTree.label_plural',
            },
        },
        activation: {
            types: {
                [ActivationType.None]: {
                    label: 'GENERIC.None',
                },
                [ActivationType.SkillTest]: {
                    label: 'COSMERE.Item.Activation.Type.SkillTest',
                },
                [ActivationType.Utility]: {
                    label: 'COSMERE.Item.Activation.Type.Utility',
                },
            },
            consumeTypes: {
                [ItemConsumeType.Resource]: {
                    label: 'COSMERE.Item.Activation.ConsumeType.Resource.Label',
                },
                [ItemConsumeType.Item]: {
                    label: 'COSMERE.Item.Activation.ConsumeType.Item.Label',
                },
            },
            uses: {
                types: {
                    [ItemUseType.Use]: {
                        label: 'COSMERE.Item.Activation.Uses.Types.Use.Singular',
                        labelPlural:
                            'COSMERE.Item.Activation.Uses.Types.Use.Plural',
                    },
                    [ItemUseType.Charge]: {
                        label: 'COSMERE.Item.Activation.Uses.Types.Charge.Singular',
                        labelPlural:
                            'COSMERE.Item.Activation.Uses.Types.Charge.Plural',
                    },
                },
                recharge: {
                    [ItemRechargeType.PerScene]: {
                        label: 'COSMERE.Item.Activation.Uses.Recharge.PerScene',
                    },
                },
            },
        },
        equip: {
            types: {
                [EquipType.Wear]: {
                    label: 'COSMERE.Item.Equip.Types.Wear.Label',
                },
                [EquipType.Hold]: {
                    label: 'COSMERE.Item.Equip.Types.Hold.Label',
                },
            },
            hold: {
                [HoldType.OneHanded]: {
                    label: 'COSMERE.Item.Equip.Hold.OneHanded.Label',
                },
                [HoldType.TwoHanded]: {
                    label: 'COSMERE.Item.Equip.Hold.TwoHanded.Label',
                },
            },
            hand: {
                [EquipHand.Main]: {
                    label: 'COSMERE.Item.Equip.Hand.Main.Label',
                },
                [EquipHand.Off]: {
                    label: 'COSMERE.Item.Equip.Hand.Off.Label',
                },
            },
        },
        equipment: {
            types: {
                [EquipmentType.Basic]: {
                    label: 'COSMERE.Item.Equipment.Type.Basic',
                },
            },
        },
        goal: {
            rewards: {
                types: {
                    [Goal.Reward.Type.Items]:
                        'COSMERE.Item.Goal.Reward.Type.Items',
                    [Goal.Reward.Type.SkillRanks]:
                        'COSMERE.Item.Goal.Reward.Type.SkillRanks',
                },
            },
        },
        talent: {
            types: {
                [Talent.Type.Ancestry]: {
                    label: 'COSMERE.Item.Talent.Type.Ancestry',
                },
                [Talent.Type.Path]: {
                    label: 'COSMERE.Item.Talent.Type.Path',
                },
                [Talent.Type.Power]: {
                    label: 'COSMERE.Item.Talent.Type.Power',
                },
            },
            prerequisite: {
                types: {
                    [Talent.Prerequisite.Type.Talent]:
                        'COSMERE.Item.Talent.Prerequisite.Type.Talent',
                    [Talent.Prerequisite.Type.Attribute]:
                        'COSMERE.Item.Talent.Prerequisite.Type.Attribute',
                    [Talent.Prerequisite.Type.Skill]:
                        'COSMERE.Item.Talent.Prerequisite.Type.Skill',
                    [Talent.Prerequisite.Type.Connection]:
                        'COSMERE.Item.Talent.Prerequisite.Type.Connection',
                    [Talent.Prerequisite.Type.Level]:
                        'COSMERE.Item.Talent.Prerequisite.Type.Level',
                },
                modes: {
                    [Talent.Prerequisite.Mode.AnyOf]:
                        'COSMERE.Item.Talent.Prerequisite.Mode.AnyOf',
                    [Talent.Prerequisite.Mode.AllOf]:
                        'COSMERE.Item.Talent.Prerequisite.Mode.AllOf',
                },
            },
            grantRules: {
                types: {
                    [Talent.GrantRule.Type.Items]:
                        'COSMERE.Item.Talent.GrantRule.Type.Items',
                },
            },
        },
    },

    currencies: {},

    weaponTypes: {
        [WeaponType.Light]: {
            label: 'COSMERE.Item.Weapon.Type.Light',
        },
        [WeaponType.Heavy]: {
            label: 'COSMERE.Item.Weapon.Type.Heavy',
        },
        [WeaponType.Special]: {
            label: 'COSMERE.Item.Weapon.Type.Special',
        },
    },

    // TODO: These should reference their respective item ids in the compendium
    weapons: {
        [WeaponId.Improvised]: {
            label: 'COSMERE.Item.Weapon.Improvised',
            reference: '',
        },
        [WeaponId.Unarmed]: {
            label: 'COSMERE.Item.Weapon.Unarmed',
            reference: '',
        },
    },

    armors: {},

    expertiseTypes: {
        [ExpertiseType.Armor]: {
            label: 'COSMERE.Actor.Character.Expertise.Armor',
        },
        [ExpertiseType.Cultural]: {
            label: 'COSMERE.Actor.Character.Expertise.Cultural',
        },
        [ExpertiseType.Specialist]: {
            label: 'COSMERE.Actor.Character.Expertise.Specialist',
        },
        [ExpertiseType.Utility]: {
            label: 'COSMERE.Actor.Character.Expertise.Utility',
        },
        [ExpertiseType.Weapon]: {
            label: 'COSMERE.Actor.Character.Expertise.Weapon',
        },
    },

    traits: {
        weaponTraits: {
            [WeaponTraitId.Cumbersome]: {
                label: 'COSMERE.Item.Weapon.Trait.Cumbersome',
                hasValue: true,
            },
            [WeaponTraitId.Dangerous]: {
                label: 'COSMERE.Item.Weapon.Trait.Dangerous',
            },
            [WeaponTraitId.Deadly]: {
                label: 'COSMERE.Item.Weapon.Trait.Deadly',
            },
            [WeaponTraitId.Defensive]: {
                label: 'COSMERE.Item.Weapon.Trait.Defensive',
            },
            [WeaponTraitId.Discreet]: {
                label: 'COSMERE.Item.Weapon.Trait.Discreet',
            },
            [WeaponTraitId.Indirect]: {
                label: 'COSMERE.Item.Weapon.Trait.Indirect',
            },
            [WeaponTraitId.Loaded]: {
                label: 'COSMERE.Item.Weapon.Trait.Loaded',
                hasValue: true,
            },
            [WeaponTraitId.Momentum]: {
                label: 'COSMERE.Item.Weapon.Trait.Momentum',
            },
            [WeaponTraitId.Offhand]: {
                label: 'COSMERE.Item.Weapon.Trait.Offhand',
            },
            [WeaponTraitId.Pierce]: {
                label: 'COSMERE.Item.Weapon.Trait.Pierce',
            },
            [WeaponTraitId.Quickdraw]: {
                label: 'COSMERE.Item.Weapon.Trait.Quickdraw',
            },
            [WeaponTraitId.Thrown]: {
                label: 'COSMERE.Item.Weapon.Trait.Thrown',
            },
            [WeaponTraitId.TwoHanded]: {
                label: 'COSMERE.Item.Weapon.Trait.TwoHanded',
            },
            [WeaponTraitId.Unique]: {
                label: 'COSMERE.Item.Weapon.Trait.Unique',
            },
            [WeaponTraitId.Fragile]: {
                label: 'COSMERE.Item.Weapon.Trait.Fragile',
            },
            [WeaponTraitId.Reach]: {
                label: 'COSMERE.Item.Weapon.Trait.Reach',
            },
        },

        armorTraits: {
            [ArmorTraitId.Cumbersome]: {
                label: 'COSMERE.Item.Armor.Trait.Cumbersome',
                hasValue: true,
            },
            [ArmorTraitId.Dangerous]: {
                label: 'COSMERE.Item.Armor.Trait.Dangerous',
            },
            [ArmorTraitId.Presentable]: {
                label: 'COSMERE.Item.Armor.Trait.Presentable',
            },
            [ArmorTraitId.Unique]: {
                label: 'COSMERE.Item.Armor.Trait.Unique',
            },
        },
    },

    adversary: {
        roles: {
            [AdversaryRole.Minion]: {
                label: 'COSMERE.Actor.Adversary.Role.Minion',
            },
            [AdversaryRole.Rival]: {
                label: 'COSMERE.Actor.Adversary.Role.Rival',
            },
            [AdversaryRole.Boss]: {
                label: 'COSMERE.Actor.Adversary.Role.Boss',
            },
        },
    },

    deflect: {
        sources: {
            [DeflectSource.None]: {
                label: 'GENERIC.None',
            },
            [DeflectSource.Armor]: {
                label: 'COSMERE.Item.Type.Armor',
            },
        },
    },

    action: {
        types: {
            [ActionType.Basic]: {
                label: 'COSMERE.Item.Action.Type.Basic.label',
                labelPlural: 'COSMERE.Item.Action.Type.Basic.label_plural',
            },
            [ActionType.Ancestry]: {
                label: 'COSMERE.Item.Action.Type.Ancestry.label',
                labelPlural: 'COSMERE.Item.Action.Type.Ancestry.label_plural',
            },
        },
        costs: {
            [ActionCostType.Action]: {
                label: 'COSMERE.Actor.ActionCosts.Action',
            },
            [ActionCostType.Reaction]: {
                label: 'COSMERE.Actor.ActionCosts.Reaction',
            },
            [ActionCostType.FreeAction]: {
                label: 'COSMERE.Actor.ActionCosts.FreeAction',
            },
            [ActionCostType.Special]: {
                label: 'COSMERE.Actor.ActionCosts.Special',
            },
        },
    },

    attack: {
        types: {
            [AttackType.Melee]: {
                label: 'COSMERE.Attack.Type.Melee',
            },
            [AttackType.Ranged]: {
                label: 'COSMERE.Attack.Type.Ranged',
            },
        },
    },

    power: {
        types: {
            [PowerType.None]: {
                label: 'COSMERE.Item.Type.Power.label',
                plural: 'COSMERE.Item.Type.Power.label_plural',
            },
        },
    },

    damageTypes: {
        [DamageType.Energy]: {
            label: 'COSMERE.DamageTypes.Energy',
        },
        [DamageType.Impact]: {
            label: 'COSMERE.DamageTypes.Impact',
        },
        [DamageType.Keen]: {
            label: 'COSMERE.DamageTypes.Keen',
        },
        [DamageType.Spirit]: {
            label: 'COSMERE.DamageTypes.Spirit',
            ignoreDeflect: true,
        },
        [DamageType.Vital]: {
            label: 'COSMERE.DamageTypes.Vital',
            ignoreDeflect: true,
        },
        [DamageType.Healing]: {
            label: 'COSMERE.DamageTypes.Healing',
            ignoreDeflect: true,
        },
    },

    cultures: {},
    ancestries: {},

    units: {
        weight: ['lb'],
        distance: {
            ft: 'UNITS.Distance.Feet',
        },
    },

    dice: {
        advantageModes: {
            [AdvantageMode.Disadvantage]: 'DICE.AdvantageMode.Disadvantage',
            [AdvantageMode.None]: 'DICE.AdvantageMode.None',
            [AdvantageMode.Advantage]: 'DICE.AdvantageMode.Advantage',
        },
    },
};

export default COSMERE;
