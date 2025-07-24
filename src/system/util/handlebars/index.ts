import './application';

import {
    ArmorTraitId,
    WeaponTraitId,
    Skill,
    Attribute,
    ItemConsumeType,
    ActionCostType,
    DamageType,
    HoldType,
    AttackType,
} from '@src/system/types/cosmere';

import { CharacterActor, CosmereActor } from '@system/documents/actor';
import { CosmereItem } from '@system/documents/item';
import { Derived } from '@system/data/fields';

import { AnyObject } from '@src/system/types/utils';

import { ItemContext, ItemContextOptions } from './types';

Handlebars.registerHelper('add', (a: number, b: number) => a + b);
Handlebars.registerHelper('sub', (a: number, b: number) => a - b);
Handlebars.registerHelper('multi', (a: number, b: number) => a * b);
Handlebars.registerHelper('divide', (a: number, b: number) => a / b);
Handlebars.registerHelper('mod', (a: number, b: number) => a % b);

Handlebars.registerHelper('default', (v: unknown, defaultVal: unknown) => {
    return v ? v : defaultVal;
});

Handlebars.registerHelper('hasKey', (obj: AnyObject, path: string) => {
    // Split the path
    const keys = path.split('.');

    // Reduce the object
    return (
        keys.reduce(
            (obj, key, i) => {
                if (typeof obj === 'boolean') return obj;

                const isLast = i === keys.length - 1;
                return obj && key in obj
                    ? isLast
                        ? true
                        : obj[key]
                          ? (obj[key] as AnyObject)
                          : null
                    : null;
            },
            obj as AnyObject | boolean | null,
        ) !== null
    );
});

Handlebars.registerHelper(
    'replace',
    (from: string, searchValue: string, replaceValue: string) => {
        return from.replaceAll(searchValue, replaceValue);
    },
);

Handlebars.registerHelper(
    'perc',
    (value: number, max: number, floor = true) => {
        const perc = (value / max) * 100;
        const str = floor ? Math.floor(perc).toFixed() : perc.toFixed(3);
        return `${str}%`;
    },
);

Handlebars.registerHelper(
    'times',
    (count: unknown, options: Handlebars.HelperOptions): string =>
        [...Array(Number(count) || 0).keys()]
            .map((i) =>
                options.fn(i, {
                    data: options.data as unknown,
                    blockParams: [i],
                }),
            )
            .join(''),
);

Handlebars.registerHelper(
    'isNumMax',
    (value: number) => value === Number.MAX_VALUE,
);

Handlebars.registerHelper('cosmereDingbat', (type: ActionCostType) => {
    switch (type) {
        case ActionCostType.FreeAction:
            return '0';
        case ActionCostType.Reaction:
            return 'r';
        case ActionCostType.Special:
            return '*';
        default:
            return '';
    }
});

Handlebars.registerHelper(
    'derived',
    (derived?: Derived<string | number>, includeBonus = true) => {
        if (!derived) return;
        return Derived.getValue(derived, includeBonus);
    },
);

Handlebars.registerHelper(
    'bonus',
    (obj?: { value: number; bonus?: number }) => {
        if (!obj) return;
        return obj.value + (obj.bonus ?? 0);
    },
);

Handlebars.registerHelper(
    'skillMod',
    (actor: CosmereActor, skill: Skill, attribute?: Attribute) => {
        return actor.getSkillMod(skill, attribute);
    },
);

Handlebars.registerHelper(
    'formulaReplaceData',
    (formula: string, data: Record<string, unknown>) => {
        return Roll.replaceFormulaData(formula, data, { missing: '0' });
    },
);

Handlebars.registerHelper('effect-duration', (effect: ActiveEffect) => {
    if (!effect.isTemporary) return '—';

    const seconds = effect.duration.seconds;
    const turns = effect.duration.turns;
    const rounds = effect.duration.rounds;

    if (seconds) return `${seconds}s`;
    else {
        return [
            rounds
                ? `${rounds} ${game.i18n!.localize('GENERIC.Rounds')}`
                : null,
            turns ? `${turns} ${game.i18n!.localize('GENERIC.Turns')}` : null,
        ]
            .filter((v) => !!v)
            .join(', ');
    }
});

Handlebars.registerHelper(
    'itemContext',
    (item: CosmereItem, options?: { hash?: ItemContextOptions }) => {
        try {
            const context = {} as Partial<ItemContext>;
            const subtitle = [] as { text: string; classes?: string[] }[];

            const isWeapon = item.isWeapon();

            if (isWeapon) {
                context.isWeapon = true;

                const attack = item.system.attack;

                subtitle.push({
                    text: game.i18n!.localize(
                        CONFIG.COSMERE.attack.types[attack.type].label,
                    ),
                });

                if (attack.range?.value) {
                    if (
                        attack.type === AttackType.Melee &&
                        item.system.traits.reach?.active
                    ) {
                        subtitle[0].text += ` + ${attack.range.value}`;
                    } else if (attack.type === AttackType.Ranged) {
                        subtitle[0].text += ` (${attack.range.value}${attack.range.unit}${
                            attack.range.long
                                ? `/${attack.range.long}${attack.range.unit}`
                                : ''
                        })`;
                    }
                }
            }

            if (item.isArmor() && item.system.deflect) {
                subtitle.push({
                    text: `${game.i18n!.localize(
                        'COSMERE.Item.Armor.Deflect',
                    )} [${item.system.deflect}]`,
                });
            }

            if (item.isPhysical()) {
                context.isPhysical = true;
                context.hasQuantity = item.system.quantity !== null;
                context.hasWeight = item.system.weight.value !== null;
                context.quantity = item.system.quantity;
                context.weight = {
                    value: item.system.weight.value,
                    unit: item.system.weight.unit,
                    total:
                        (item.system.quantity ?? 0) *
                        (item.system.weight.value ?? 0),
                };
                context.price = {
                    value: item.system.price.value,
                    unit: item.system.price.unit,
                };
            }

            if (item.isEquippable() && !item.system.alwaysEquipped) {
                context.isEquippable = true;
                context.equipped = item.system.equipped;

                const type = item.system.equip.type;
                const hold = item.system.equip.hold;
                const hand = item.system.equip.hand;

                context.equip = {
                    type,
                    typeLabel: CONFIG.COSMERE.items.equip.types[type].label,

                    hold,
                    ...(hold
                        ? {
                              holdLabel:
                                  CONFIG.COSMERE.items.equip.hold[hold].label,
                          }
                        : {}),

                    hand,
                    ...(hand
                        ? {
                              handLabel:
                                  CONFIG.COSMERE.items.equip.hand[hand].label,
                          }
                        : {}),
                };

                if (options?.hash?.showEquippedHand !== false) {
                    if (hold && hold !== HoldType.TwoHanded) {
                        subtitle.push({
                            text: game.i18n!.localize(
                                CONFIG.COSMERE.items.equip.hold[hold].label,
                            ),
                        });
                    }
                }
            }

            if (item.hasTraits()) {
                subtitle.push(
                    ...item.system.traitsArray
                        .filter((trait) => trait.active)
                        .map((trait) => {
                            // Get the config
                            const config = isWeapon
                                ? CONFIG.COSMERE.traits.weaponTraits[
                                      trait.id as WeaponTraitId
                                  ]
                                : CONFIG.COSMERE.traits.armorTraits[
                                      trait.id as ArmorTraitId
                                  ];

                            const modifiedByExpertise =
                                trait.active !== trait.defaultActive ||
                                trait.value !== trait.defaultValue;

                            return {
                                text: `${game.i18n!.localize(config.label)} ${config.hasValue ? `[${trait.value}]` : ''}`.trim(),
                                classes: modifiedByExpertise
                                    ? ['highlight']
                                    : [],
                            };
                        })
                        .sort((a, b) => a.classes.length - b.classes.length),
                );
            }

            if (item.hasActivation()) {
                context.hasActivation = true;
                context.activation = {};

                if (item.system.activation.cost?.type) {
                    context.activation.hasCost = true;
                    context.activation.cost = {
                        type: item.system.activation.cost.type,
                        typeLabel:
                            CONFIG.COSMERE.action.costs[
                                item.system.activation.cost.type
                            ].label,
                        value: item.system.activation.cost.value,
                    };
                }

                // Check if a skill test is configured
                if (item.system.activation.skill) {
                    const skill = item.system.activation.skill;
                    const attribute = item.system.activation.attribute;

                    context.hasSkillTest = true;
                    context.skillTest = {
                        skill,
                        skillLabel: CONFIG.COSMERE.skills[skill].label,
                        usesDefaultAttribute:
                            !attribute ||
                            attribute ===
                                CONFIG.COSMERE.skills[skill].attribute,

                        ...(attribute
                            ? {
                                  attribute,
                                  attributeLabel:
                                      CONFIG.COSMERE.attributes[attribute]
                                          .label,
                                  attributeLabelShort:
                                      CONFIG.COSMERE.attributes[attribute]
                                          .labelShort,
                              }
                            : {}),
                    };
                }

                // Check if the activation consumes some resource
                if (item.system.activation.consume) {
                    const consumesResource =
                        item.system.activation.consume.type ===
                        ItemConsumeType.Resource;
                    const consumesItem =
                        item.system.activation.consume.type ===
                        ItemConsumeType.Item;

                    // Get resource
                    const resource = item.system.activation.consume.resource;

                    context.hasConsume = true;
                    context.consume = {
                        type: item.system.activation.consume.type,
                        value: item.system.activation.consume.value,
                        consumesResource,
                        consumesItem,

                        ...(resource
                            ? {
                                  resource:
                                      item.system.activation.consume.resource,
                                  resourceLabel:
                                      CONFIG.COSMERE.resources[resource].label,
                              }
                            : {}),
                    };
                }

                if (item.system.activation.uses) {
                    const type = item.system.activation.uses.type;
                    const value = item.system.activation.uses.value;
                    const max = item.system.activation.uses.max;
                    const recharge = item.system.activation.uses.recharge;

                    const hasRecharge = recharge != null;

                    // Get config
                    const config =
                        CONFIG.COSMERE.items.activation.uses.types[type];

                    context.hasUses = true;
                    context.uses = {
                        type,
                        value,
                        label:
                            (max ?? value) > 1
                                ? config.labelPlural
                                : config.label,
                        max,
                        hasRecharge,
                        recharge,
                        rechargeLabel: hasRecharge
                            ? CONFIG.COSMERE.items.activation.uses.recharge[
                                  recharge
                              ].label
                            : '',
                    };
                }
            }

            if (item.hasDamage() && item.system.damage.formula) {
                const skill = item.system.damage.skill;
                const attribute = item.system.damage.attribute;

                const hasSkill = !!skill;
                const hasAttribute = !!attribute;

                context.hasDamage = true;
                context.damage = {
                    formula: item.system.damage.formula,
                    formulaData: {
                        ...item.actor?.getRollData(),
                    },
                    hasSkill,
                    hasAttribute,

                    ...(hasSkill
                        ? {
                              skill,
                              skillLabel: CONFIG.COSMERE.skills[skill].label,
                              usesDefaultAttribute:
                                  !hasAttribute ||
                                  attribute ===
                                      CONFIG.COSMERE.skills[skill].attribute,
                          }
                        : {}),

                    ...(hasAttribute
                        ? {
                              attribute,
                              attributeLabel:
                                  CONFIG.COSMERE.attributes[attribute].label,
                              attributeLabelShort:
                                  CONFIG.COSMERE.attributes[attribute]
                                      .labelShort,
                          }
                        : {}),

                    ...(item.system.damage.type
                        ? {
                              type: item.system.damage.type,
                              typeLabel:
                                  CONFIG.COSMERE.damageTypes[
                                      item.system.damage.type
                                  ].label,
                          }
                        : {}),
                };
            }

            if (item.isAction()) {
                subtitle.push({
                    text: game.i18n!.localize(
                        CONFIG.COSMERE.action.types[item.system.type].label,
                    ),
                });
            }

            return {
                ...context,
                subtitle: subtitle
                    .map(
                        ({ text, classes }) =>
                            `<span class=${(classes ?? []).join(' ')}>${text}</span>`,
                    )
                    .join('<span>, </span>'),
            };
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
);

Handlebars.registerHelper('damageTypeConfig', (type: DamageType) => {
    return CONFIG.COSMERE.damageTypes[type];
});

export async function preloadHandlebarsTemplates() {
    const partials = [
        'systems/cosmere-rpg/templates/general/tabs.hbs',
        'systems/cosmere-rpg/templates/actors/character/partials/char-details-tab.hbs',
        'systems/cosmere-rpg/templates/actors/character/partials/char-actions-tab.hbs',
        'systems/cosmere-rpg/templates/actors/character/partials/char-equipment-tab.hbs',
        'systems/cosmere-rpg/templates/actors/character/partials/char-goals-tab.hbs',
        'systems/cosmere-rpg/templates/actors/character/partials/char-effects-tab.hbs',
        'systems/cosmere-rpg/templates/actors/adversary/partials/adv-actions-tab.hbs',
        'systems/cosmere-rpg/templates/actors/adversary/partials/adv-effects-tab.hbs',
        'systems/cosmere-rpg/templates/actors/adversary/partials/adv-equipment-tab.hbs',
        'systems/cosmere-rpg/templates/item/partials/item-description-tab.hbs',
        'systems/cosmere-rpg/templates/item/partials/item-effects-tab.hbs',
        'systems/cosmere-rpg/templates/item/partials/item-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/injury/partials/injury-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/specialty/partials/specialty-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/loot/partials/loot-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/armor/partials/armor-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/ancestry/partials/ancestry-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/talent/partials/talent-details-tab.hbs',
        'systems/cosmere-rpg/templates/item/action/partials/action-details-tab.hbs',
        'systems/cosmere-rpg/templates/combat/combatant.hbs',
        'systems/cosmere-rpg/templates/chat/parts/roll-details.hbs',
        'systems/cosmere-rpg/templates/chat/parts/chat-card-header.hbs',
    ];
    return await loadTemplates(
        partials.reduce(
            (partials, path) => {
                partials[path.split('/').pop()!.replace('.hbs', '')] = path;
                return partials;
            },
            {} as Record<string, string>,
        ),
    );
}
