// Types
import { CosmereRPGConfig } from './types/config';
import {
    Size,
    CreatureType,
    Status,
    InjuryType,
    Attribute,
    AttributeGroup,
    Resource,
    Skill,
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
    MovementType,
    ImmunityType,
} from './types/cosmere';
import { AdvantageMode } from './types/roll';

import { Talent, TalentTree } from './types/item';

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

    movement: {
        types: {
            [MovementType.Walk]: {
                label: 'COSMERE.Actor.Movement.Type.Walk',
            },
            [MovementType.Swim]: {
                label: 'COSMERE.Actor.Movement.Type.Swim',
            },
            [MovementType.Fly]: {
                label: 'COSMERE.Actor.Movement.Type.Fly',
            },
        },
    },

    themes: {
        [Theme.Default]: 'COSMERE.Theme.Default',
    },

    statuses: {
        [Status.Afflicted]: {
            label: 'COSMERE.Status.Afflicted',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/afflicted.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#afflicted',
            condition: true,
        },
        [Status.Blind]: {
            label: 'COSMERE.Status.Blind',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/blind.svg',
            condition: false,
        },
        [Status.Burrowing]: {
            label: 'COSMERE.Status.Burrowing',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/burrowing.svg',
            condition: false,
        },
        [Status.Determined]: {
            label: 'COSMERE.Status.Determined',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/determined.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#determined',
            condition: true,
        },
        [Status.Disoriented]: {
            label: 'COSMERE.Status.Disoriented',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/disoriented.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#disoriented',
            condition: true,
        },
        [Status.Empowered]: {
            label: 'COSMERE.Status.Empowered',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/empowered.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#empowered',
            condition: true,
        },
        [Status.Enhanced]: {
            label: 'COSMERE.Status.Enhanced',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/enhanced.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#enhanced',
            condition: true,
        },
        [Status.Exhausted]: {
            label: 'COSMERE.Status.Exhausted',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/exhausted.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#exhausted',
            condition: true,
            stackable: true,
            stacksDisplayTransform: (stacks) => (-stacks).toFixed(),
        },
        [Status.Flying]: {
            label: 'COSMERE.Status.Flying',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/flying.svg',
            condition: false,
        },
        [Status.Focused]: {
            label: 'COSMERE.Status.Focused',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/focused.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#focused',
            condition: true,
        },
        [Status.Hidden]: {
            label: 'COSMERE.Status.Hidden',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/hidden.svg',
            condition: false,
        },
        [Status.Immobilized]: {
            label: 'COSMERE.Status.Immobilized',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/immobilized.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#immobilized',
            condition: true,
        },
        [Status.Invisible]: {
            label: 'COSMERE.Status.Invisible',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/invisible.svg',
            condition: false,
        },
        [Status.Prone]: {
            label: 'COSMERE.Status.Prone',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/prone.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#prone',
            condition: true,
        },
        [Status.Restrained]: {
            label: 'COSMERE.Status.Restrained',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/restrained.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#restrained',
            condition: true,
        },
        [Status.Slowed]: {
            label: 'COSMERE.Status.Slowed',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/slowed.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#slowed',
            condition: true,
        },
        [Status.Stunned]: {
            label: 'COSMERE.Status.Stunned',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/stunned.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#stunned',
            condition: true,
        },
        [Status.Surprised]: {
            label: 'COSMERE.Status.Surprised',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/surprised.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#surprised',
            condition: true,
        },
        [Status.Unconscious]: {
            label: 'COSMERE.Status.Unconscious',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/unconscious.svg',
            reference:
                'Compendium.cosmere-rpg.rules.JournalEntry.A3Ac4yL1J0tdYcjP.JournalEntryPage.OMT0NRT0IcBuHczN#unconscious',
            condition: true,
        },
        [Status.Dead]: {
            label: 'COSMERE.Status.Dead',
            icon: 'systems/cosmere-rpg/assets/icons/svg/conditions/dead.svg',
            condition: true,
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
            skills: [Skill.Athletics, Skill.HeavyWeapons],
        },
        [Attribute.Speed]: {
            key: Attribute.Speed,
            label: 'COSMERE.Actor.Attribute.Speed.long',
            labelShort: 'COSMERE.Actor.Attribute.Speed.short',
            skills: [
                Skill.Agility,
                Skill.LightWeapons,
                Skill.Stealth,
                Skill.Thievery,
            ],
        },
        [Attribute.Intellect]: {
            key: Attribute.Intellect,
            label: 'COSMERE.Actor.Attribute.Intellect.long',
            labelShort: 'COSMERE.Actor.Attribute.Intellect.short',
            skills: [
                Skill.Crafting,
                Skill.Deduction,
                Skill.Lore,
                Skill.Medicine,
            ],
        },
        [Attribute.Willpower]: {
            key: Attribute.Willpower,
            label: 'COSMERE.Actor.Attribute.Willpower.long',
            labelShort: 'COSMERE.Actor.Attribute.Willpower.short',
            skills: [Skill.Discipline, Skill.Intimidation],
        },
        [Attribute.Awareness]: {
            key: Attribute.Awareness,
            label: 'COSMERE.Actor.Attribute.Awareness.long',
            labelShort: 'COSMERE.Actor.Attribute.Awareness.short',
            skills: [Skill.Insight, Skill.Perception, Skill.Survival],
        },
        [Attribute.Presence]: {
            key: Attribute.Presence,
            label: 'COSMERE.Actor.Attribute.Presence.long',
            labelShort: 'COSMERE.Actor.Attribute.Presence.short',
            skills: [Skill.Deception, Skill.Leadership, Skill.Persuasion],
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
        [Skill.Agility]: {
            key: Skill.Agility,
            label: 'COSMERE.Actor.Skill.Agility',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skill.Athletics]: {
            key: Skill.Athletics,
            label: 'COSMERE.Actor.Skill.Athletics',
            attribute: Attribute.Strength,
            core: true,
        },
        [Skill.HeavyWeapons]: {
            key: Skill.HeavyWeapons,
            label: 'COSMERE.Actor.Skill.HeavyWeapons',
            attribute: Attribute.Strength,
            core: true,
        },
        [Skill.LightWeapons]: {
            key: Skill.LightWeapons,
            label: 'COSMERE.Actor.Skill.LightWeapons',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skill.Stealth]: {
            key: Skill.Stealth,
            label: 'COSMERE.Actor.Skill.Stealth',
            attribute: Attribute.Speed,
            core: true,
        },
        [Skill.Thievery]: {
            key: Skill.Thievery,
            label: 'COSMERE.Actor.Skill.Thievery',
            attribute: Attribute.Speed,
            core: true,
        },

        [Skill.Crafting]: {
            key: Skill.Crafting,
            label: 'COSMERE.Actor.Skill.Crafting',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skill.Deduction]: {
            key: Skill.Deduction,
            label: 'COSMERE.Actor.Skill.Deduction',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skill.Discipline]: {
            key: Skill.Discipline,
            label: 'COSMERE.Actor.Skill.Discipline',
            attribute: Attribute.Willpower,
            core: true,
        },
        [Skill.Intimidation]: {
            key: Skill.Intimidation,
            label: 'COSMERE.Actor.Skill.Intimidation',
            attribute: Attribute.Willpower,
            core: true,
        },
        [Skill.Lore]: {
            key: Skill.Lore,
            label: 'COSMERE.Actor.Skill.Lore',
            attribute: Attribute.Intellect,
            core: true,
        },
        [Skill.Medicine]: {
            key: Skill.Medicine,
            label: 'COSMERE.Actor.Skill.Medicine',
            attribute: Attribute.Intellect,
            core: true,
        },

        [Skill.Deception]: {
            key: Skill.Deception,
            label: 'COSMERE.Actor.Skill.Deception',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skill.Insight]: {
            key: Skill.Insight,
            label: 'COSMERE.Actor.Skill.Insight',
            attribute: Attribute.Awareness,
            core: true,
        },
        [Skill.Leadership]: {
            key: Skill.Leadership,
            label: 'COSMERE.Actor.Skill.Leadership',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skill.Perception]: {
            key: Skill.Perception,
            label: 'COSMERE.Actor.Skill.Perception',
            attribute: Attribute.Awareness,
            core: true,
        },
        [Skill.Persuasion]: {
            key: Skill.Persuasion,
            label: 'COSMERE.Actor.Skill.Persuasion',
            attribute: Attribute.Presence,
            core: true,
        },
        [Skill.Survival]: {
            key: Skill.Survival,
            label: 'COSMERE.Actor.Skill.Survival',
            attribute: Attribute.Awareness,
            core: true,
        },
    },

    advancement: {
        rules: [
            {
                level: 1,
                tier: 1,
                maxSkillRanks: 2,
                attributePoints: 12,
                health: 10,
                healthIncludeStrength: true,
                skillRanks: 4,
                talents: 1,
            }, // Level 1
            {
                level: 2,
                tier: 1,
                maxSkillRanks: 2,
                health: 5,
                skillRanks: 2,
                talents: 1,
            }, // Level 2
            {
                level: 3,
                tier: 1,
                maxSkillRanks: 2,
                attributePoints: 1,
                health: 5,
                skillRanks: 2,
                talents: 1,
            }, // Level 3
            {
                level: 4,
                tier: 1,
                maxSkillRanks: 2,
                health: 5,
                skillRanks: 2,
                talents: 1,
            }, // Level 4
            {
                level: 5,
                tier: 1,
                maxSkillRanks: 2,
                health: 5,
                skillRanks: 2,
                talents: 1,
            }, // Level 5
            {
                level: 6,
                tier: 2,
                maxSkillRanks: 3,
                attributePoints: 1,
                health: 4,
                healthIncludeStrength: true,
                skillRanks: 2,
                talents: 1,
            }, // Level 6
            {
                level: 7,
                tier: 2,
                maxSkillRanks: 3,
                health: 4,
                skillRanks: 2,
                talents: 1,
            }, // Level 7
            {
                level: 8,
                tier: 2,
                maxSkillRanks: 3,
                health: 4,
                skillRanks: 2,
                talents: 1,
            }, // Level 8
            {
                level: 9,
                tier: 2,
                maxSkillRanks: 3,
                attributePoints: 1,
                health: 4,
                skillRanks: 2,
                talents: 1,
            }, // Level 9
            {
                level: 10,
                tier: 2,
                maxSkillRanks: 3,
                health: 4,
                skillRanks: 2,
                talents: 1,
            }, // Level 10
            {
                level: 11,
                tier: 3,
                maxSkillRanks: 4,
                health: 3,
                healthIncludeStrength: true,
                skillRanks: 2,
                talents: 1,
            }, // Level 11
            {
                level: 12,
                tier: 3,
                maxSkillRanks: 4,
                attributePoints: 1,
                health: 3,
                skillRanks: 2,
                talents: 1,
            }, // Level 12
            {
                level: 13,
                tier: 3,
                maxSkillRanks: 4,
                health: 3,
                skillRanks: 2,
                talents: 1,
            }, // Level 13
            {
                level: 14,
                tier: 3,
                maxSkillRanks: 4,
                health: 3,
                skillRanks: 2,
                talents: 1,
            }, // Level 14
            {
                level: 15,
                tier: 3,
                maxSkillRanks: 4,
                attributePoints: 1,
                health: 3,
                skillRanks: 2,
                talents: 1,
            }, // Level 15
            {
                level: 16,
                tier: 4,
                maxSkillRanks: 5,
                health: 2,
                healthIncludeStrength: true,
                skillRanks: 2,
                talents: 1,
            }, // Level 16
            {
                level: 17,
                tier: 4,
                maxSkillRanks: 5,
                health: 2,
                skillRanks: 2,
                talents: 1,
            }, // Level 17
            {
                level: 18,
                tier: 4,
                maxSkillRanks: 5,
                attributePoints: 1,
                health: 2,
                skillRanks: 2,
                talents: 1,
            }, // Level 18
            {
                level: 19,
                tier: 4,
                maxSkillRanks: 5,
                health: 2,
                skillRanks: 2,
                talents: 1,
            }, // Level 19
            {
                level: 20,
                tier: 4,
                maxSkillRanks: 5,
                health: 2,
                skillRanks: 2,
                talents: 1,
            }, // Level 20
            {
                level: 21,
                tier: 5,
                maxSkillRanks: 5,
                health: 1,
                skillRanksOrTalents: 1,
            }, // Level 21
        ],
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
        weapon: {
            types: {
                [WeaponType.Light]: {
                    label: 'COSMERE.Item.Weapon.Type.Light',
                    skill: Skill.LightWeapons,
                },
                [WeaponType.Heavy]: {
                    label: 'COSMERE.Item.Weapon.Type.Heavy',
                    skill: Skill.HeavyWeapons,
                },
                [WeaponType.Special]: {
                    label: 'COSMERE.Item.Weapon.Type.Special',
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
        },
        talentTree: {
            node: {
                prerequisite: {
                    types: {
                        [TalentTree.Node.Prerequisite.Type.Talent]:
                            'COSMERE.Item.Talent.Prerequisite.Type.talent',
                        [TalentTree.Node.Prerequisite.Type.Attribute]:
                            'COSMERE.Item.Talent.Prerequisite.Type.attribute',
                        [TalentTree.Node.Prerequisite.Type.Skill]:
                            'COSMERE.Item.Talent.Prerequisite.Type.skill',
                        [TalentTree.Node.Prerequisite.Type.Connection]:
                            'COSMERE.Item.Talent.Prerequisite.Type.connection',
                        [TalentTree.Node.Prerequisite.Type.Level]:
                            'COSMERE.Item.Talent.Prerequisite.Type.level',
                        [TalentTree.Node.Prerequisite.Type.Ancestry]:
                            'COSMERE.Item.Talent.Prerequisite.Type.ancestry',
                        [TalentTree.Node.Prerequisite.Type.Culture]:
                            'COSMERE.Item.Talent.Prerequisite.Type.culture',
                        [TalentTree.Node.Prerequisite.Type.Goal]:
                            'COSMERE.Item.Talent.Prerequisite.Type.goal',
                    },
                },
            },
        },

        events: {
            types: {}, // Default events registered using the api
            handlers: {}, // Default handlers registered using the api
        },
    },

    currencies: {},

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
            configRegistryKey: 'armors',
            icon: 'fas fa-helmet-battle',
        },
        [ExpertiseType.Cultural]: {
            label: 'COSMERE.Actor.Character.Expertise.Cultural',
            configRegistryKey: 'cultures',
            icon: 'far fa-earth-asia',
        },
        [ExpertiseType.Specialist]: {
            label: 'COSMERE.Actor.Character.Expertise.Specialist',
            icon: 'fas fa-award',
        },
        [ExpertiseType.Utility]: {
            label: 'COSMERE.Actor.Character.Expertise.Utility',
            icon: 'fas fa-wrench',
        },
        [ExpertiseType.Weapon]: {
            label: 'COSMERE.Actor.Character.Expertise.Weapon',
            configRegistryKey: 'weapons',
            icon: 'fas fa-sword',
        },
    },

    immunityTypes: {
        [ImmunityType.Damage]: {
            label: 'GENERIC.Damage',
            icon: 'fas fa-heart-crack',
        },
        [ImmunityType.Condition]: {
            label: 'GENERIC.Condition',
            icon: 'fas fa-bolt',
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
            [ActionType.Adversary]: {
                label: 'COSMERE.Item.Action.Type.Adversary.label',
                labelPlural: 'COSMERE.Item.Action.Type.Adversary.label_plural',
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
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/energy.svg',
        },
        [DamageType.Impact]: {
            label: 'COSMERE.DamageTypes.Impact',
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/impact.svg',
        },
        [DamageType.Keen]: {
            label: 'COSMERE.DamageTypes.Keen',
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/keen.svg',
        },
        [DamageType.Spirit]: {
            label: 'COSMERE.DamageTypes.Spirit',
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/spirit.svg',
            ignoreDeflect: true,
        },
        [DamageType.Vital]: {
            label: 'COSMERE.DamageTypes.Vital',
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/vital.svg',
            ignoreDeflect: true,
        },
        [DamageType.Healing]: {
            label: 'COSMERE.DamageTypes.Healing',
            icon: 'systems/cosmere-rpg/assets/icons/svg/damage/healing.svg',
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

    scaling: {
        damage: {
            unarmed: {
                strength: [
                    { min: 0, max: 2, formula: '1' },
                    { min: 3, max: 4, formula: '1d4' },
                    { min: 5, max: 6, formula: '1d8' },
                    { min: 7, max: 8, formula: '2d6' },
                    { min: 9, max: Infinity, formula: '2d10' },
                ],
            },
        },
        power: {
            die: {
                ranks: [
                    { value: 1, formula: 'd4' },
                    { value: 2, formula: 'd6' },
                    { value: 3, formula: 'd8' },
                    { value: 4, formula: 'd10' },
                    { value: 5, formula: 'd12' },
                ],
            },
            effectSize: {
                ranks: [
                    { value: 1, formula: Size.Small },
                    { value: 2, formula: Size.Medium },
                    { value: 3, formula: Size.Large },
                    { value: 4, formula: Size.Huge },
                    { value: 5, formula: Size.Garguantuan },
                ],
            },
        },
    },

    dice: {
        advantageModes: {
            [AdvantageMode.Disadvantage]: 'DICE.AdvantageMode.Disadvantage',
            [AdvantageMode.None]: 'DICE.AdvantageMode.None',
            [AdvantageMode.Advantage]: 'DICE.AdvantageMode.Advantage',
        },
    },

    sheet: {
        actor: {
            components: {
                actions: {
                    sections: {
                        static: {},
                        dynamic: {},
                    },
                },
            },
        },
    },
};

export default COSMERE;
