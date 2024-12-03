import {
    ItemType,
    Skill,
    Attribute,
    ItemConsumeType,
    ActivationType,
    WeaponTraitId,
    ArmorTraitId,
    ActionCostType,
} from '@system/types/cosmere';
import { Goal } from '@system/types/item';
import { GoalItemData } from '@system/data/item/goal';
import { DeepPartial } from '@system/types/utils';

import { CosmereActor } from './actor';

import { SYSTEM_ID } from '../constants';

import { Derived } from '@system/data/fields';

// Dialogs
import { AttackConfigurationDialog } from '@system/applications/dialogs/attack-configuration';

// Data model
import {
    WeaponItemDataModel,
    ArmorItemDataModel,
    AncestryItemDataModel,
    CultureItemDataModel,
    PathItemDataModel,
    SpecialtyItemDataModel,
    TalentItemDataModel,
    ConnectionItemDataModel,
    InjuryItemDataModel,
    ActionItemDataModel,
    TraitItemDataModel,
    LootItemDataModel,
    EquipmentItemDataModel,
    GoalItemDataModel,
    PowerItemDataModel,
    TalentTreeItemDataModel,
} from '@system/data/item';

import { ActivatableItemData } from '@system/data/item/mixins/activatable';
import { AttackingItemData } from '@system/data/item/mixins/attacking';
import { DamagingItemData } from '@system/data/item/mixins/damaging';
import { PhysicalItemData } from '@system/data/item/mixins/physical';
import { TypedItemData } from '@system/data/item/mixins/typed';
import { TraitsItemData } from '@system/data/item/mixins/traits';
import { EquippableItemData } from '@system/data/item/mixins/equippable';
import { DescriptionItemData } from '@system/data/item/mixins/description';
import { IdItemData } from '@system/data/item/mixins/id';
import { ModalityItemData } from '@system/data/item/mixins/modality';

// Rolls
import {
    d20Roll,
    damageRoll,
    D20Roll,
    D20RollData,
    DamageRoll,
    DamageRollData,
} from '@system/dice';
import { AdvantageMode } from '@system/types/roll';
import { RollMode } from '@system/dice/types';
import {
    determineConfigurationMode,
    getTargetDescriptors,
    hasKey,
} from '../utils/generic';
import { MESSAGE_TYPES } from './chat-message';
import { renderSystemTemplate, TEMPLATES } from '../utils/templates';

// Constants
const CONSUME_CONFIGURATION_DIALOG_TEMPLATE =
    'systems/cosmere-rpg/templates/item/dialog/item-consume.hbs';
const ACTIVITY_CARD_TEMPLATE =
    'systems/cosmere-rpg/templates/chat/activity-card.hbs';
const NONE = 'none';
type None = typeof NONE;

interface ShowConsumeDialogOptions {
    /**
     * The default state of the consume checkbox in the dialog
     */
    shouldConsume?: boolean;

    /**
     * The title of the dialog window
     */
    title?: string;

    /**
     * The consumption type
     */
    consumeType?: ItemConsumeType;
}

export interface CosmereItemData<
    T extends foundry.abstract.DataSchema = foundry.abstract.DataSchema,
> {
    name: string;
    type: ItemType;
    system?: T;
}

export class CosmereItem<
    T extends foundry.abstract.DataSchema = foundry.abstract.DataSchema,
> extends Item<T, CosmereActor> {
    // Redeclare `item.type` to specifically be of `ItemType`.
    // This way we avoid casting everytime we want to check its type
    declare type: ItemType;

    /* --- ItemType type guards --- */

    public isWeapon(): this is CosmereItem<WeaponItemDataModel> {
        return this.type === ItemType.Weapon;
    }

    public isArmor(): this is CosmereItem<ArmorItemDataModel> {
        return this.type === ItemType.Armor;
    }

    public isAncestry(): this is CosmereItem<AncestryItemDataModel> {
        return this.type === ItemType.Ancestry;
    }

    public isCulture(): this is CosmereItem<CultureItemDataModel> {
        return this.type === ItemType.Culture;
    }

    public isPath(): this is CosmereItem<PathItemDataModel> {
        return this.type === ItemType.Path;
    }

    public isSpecialty(): this is CosmereItem<SpecialtyItemDataModel> {
        return this.type === ItemType.Specialty;
    }

    public isTalent(): this is CosmereItem<TalentItemDataModel> {
        return this.type === ItemType.Talent;
    }

    public isConnection(): this is CosmereItem<ConnectionItemDataModel> {
        return this.type === ItemType.Connection;
    }

    public isInjury(): this is CosmereItem<InjuryItemDataModel> {
        return this.type === ItemType.Injury;
    }

    public isAction(): this is CosmereItem<ActionItemDataModel> {
        return this.type === ItemType.Action;
    }

    public isTrait(): this is CosmereItem<TraitItemDataModel> {
        return this.type === ItemType.Trait;
    }

    public isEquipment(): this is CosmereItem<EquipmentItemDataModel> {
        return this.type === ItemType.Equipment;
    }

    public isGoal(): this is GoalItem {
        return this.type === ItemType.Goal;
    }

    public isPower(): this is PowerItem {
        return this.type === ItemType.Power;
    }

    public isTalentTree(): this is CosmereItem<TalentTreeItemDataModel> {
        return this.type === ItemType.TalentTree;
    }

    /* --- Mixin type guards --- */

    /**
     * Can this item be activated?
     */
    public hasActivation(): this is CosmereItem<ActivatableItemData> {
        return 'activation' in this.system;
    }

    /**
     * Does this item have an attack?
     */
    public hasAttack(): this is CosmereItem<AttackingItemData> {
        return 'attack' in this.system;
    }

    /**
     * Does this item deal damage?
     */
    public hasDamage(): this is CosmereItem<DamagingItemData> {
        return 'damage' in this.system;
    }

    /**
     * Is this item physical?
     */
    public isPhysical(): this is CosmereItem<PhysicalItemData> {
        return 'weight' in this.system && 'price' in this.system;
    }

    /**
     * Does this item have a sub-type?
     */
    public isTyped(): this is CosmereItem<TypedItemData> {
        return 'type' in this.system;
    }

    /**
     * Does this item have traits?
     * Not to be confused adversary traits. (Which are their own item type.)
     */
    public hasTraits(): this is CosmereItem<TraitsItemData> {
        return 'traits' in this.system;
    }

    /**
     * Can this item be equipped?
     */
    public isEquippable(): this is CosmereItem<EquippableItemData> {
        return 'equipped' in this.system;
    }

    /**
     * Does this item have a description?
     */
    public hasDescription(): this is CosmereItem<DescriptionItemData> {
        return 'description' in this.system;
    }

    /**
     * Does this item have an id in it system?
     */
    public hasId(): this is CosmereItem<IdItemData> {
        return 'id' in this.system;
    }

    /**
     * Does this item have modality?
     */
    public hasModality(): this is CosmereItem<ModalityItemData> {
        return 'modality' in this.system;
    }

    /* --- Accessors --- */

    public get isFavorite(): boolean {
        return this.getFlag(SYSTEM_ID, 'favorites.isFavorite');
    }

    /**
     * Checks if the talent item mode is active.
     * Only relevant for talents that have a modality configured.
     */
    public get isModeActive(): boolean {
        // Check if item is talent
        if (!this.isTalent()) return false;

        // Check if item has modality
        if (!this.system.modality) return false;

        // Check actor
        if (!this.actor) return false;

        // Get modality id
        const modalityId = this.system.modality;

        // Check actor modality flag
        const activeMode = this.actor.getFlag(SYSTEM_ID, `mode.${modalityId}`);

        // Check if the actor has the mode active
        return activeMode === this.system.id;
    }

    /* --- Lifecycle --- */

    override _onUpdate(_changes: object, options: object, userId: string) {
        super._onUpdate(_changes, options, userId);

        if (game.user?.id !== userId) return;

        if (this.isGoal()) {
            const changes: { system?: DeepPartial<GoalItemData> } = _changes;

            if (changes.system?.level === 3) {
                this.handleGoalComplete();
            }
        }
    }

    /* --- Event handlers --- */

    protected handleGoalComplete() {
        // Ensure the item is a goal
        if (!this.isGoal()) return;

        // Ensure actor is set
        if (!this.actor) return;

        // Get the rewards
        const rewards = this.system.rewards;

        // Handle rewards
        rewards.forEach(async (reward) => {
            if (reward.type === Goal.Reward.Type.SkillRanks) {
                await this.actor!.modifySkillRank(reward.skill, reward.ranks);

                // Notification
                ui.notifications.info(
                    game.i18n!.format(
                        'GENERIC.Notification.IncreasedSkillRank',
                        {
                            skill: CONFIG.COSMERE.skills[reward.skill].label,
                            amount: reward.ranks,
                            actor: this.actor!.name,
                        },
                    ),
                );
            } else if (reward.type === Goal.Reward.Type.Items) {
                reward.items.forEach(async (itemUUID) => {
                    // Get the item
                    const item = (await fromUuid(
                        itemUUID,
                    )) as unknown as CosmereItem;

                    // Get the id
                    const id = item.hasId() ? item.system.id : null;

                    // Ensure the item is not already embedded
                    if (
                        id &&
                        this.actor!.items.some(
                            (i) => i.hasId() && i.system.id === id,
                        )
                    )
                        return;

                    // Add the item to the actor
                    await this.actor!.createEmbeddedDocuments('Item', [
                        item.toObject(),
                    ]);

                    // Notification
                    ui.notifications.info(
                        game.i18n!.format('GENERIC.Notification.AddedItem', {
                            type: game.i18n!.localize(
                                `TYPES.Item.${item.type}`,
                            ),
                            item: item.name,
                            actor: this.actor!.name,
                        }),
                    );
                });
            }
        });
    }

    /* --- Roll & Usage utilities --- */

    /**
     * Roll utility for activable items.
     * This function **only** performs the roll, it does not consume resources.
     * For item usages with resource consumtion use `item.use` instead.
     */
    public async roll(
        options: CosmereItem.RollOptions = {},
    ): Promise<D20Roll | null> {
        if (!this.hasActivation()) return null;

        // Get the actor to roll for (either assigned through option, the parent of this item, or the first controlled actor)
        const actor =
            options.actor ??
            this.actor ??
            (game.canvas?.tokens?.controlled?.[0]?.actor as
                | CosmereActor
                | undefined);

        // Ensure an actor was found
        if (!actor) {
            ui.notifications.warn(
                game.i18n!.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        // Get skill to use
        const skillId = options.skill ?? this.system.activation.skill;
        if (!skillId) return null;
        const skill = actor.system.skills[skillId];

        // Get the attribute id
        const attributeId =
            options.attribute ??
            this.system.activation.attribute ??
            skill.attribute;

        // Set up actor data
        const data: D20RollData = this.getSkillTestRollData(
            skillId,
            attributeId,
            actor,
        );

        const parts = ['@mod'].concat(options.parts ?? []);
        if (options.temporaryModifiers) parts.push(options.temporaryModifiers);

        // Perform the roll
        const roll = await d20Roll(
            foundry.utils.mergeObject(options, {
                data,
                chatMessage: false,
                title: `${this.name} (${game.i18n!.localize(
                    CONFIG.COSMERE.skills[skillId].label,
                )})`,
                defaultAttribute: skill.attribute,
                parts: parts,
                plotDie: options.plotDie ?? this.system.activation.plotDie,
                opportunity:
                    options.opportunity ?? this.system.activation.opportunity,
                complication:
                    options.complication ?? this.system.activation.complication,
            }),
        );

        if (roll && options.chatMessage !== false) {
            // Get the speaker
            const speaker =
                options.speaker ??
                (ChatMessage.getSpeaker({ actor }) as ChatSpeakerData);

            // Create chat message
            await roll.toMessage({
                speaker,
            });
        }

        return roll;
    }

    /**
     * Utility for rolling damage.
     * Only works for items that have damage configured.
     */
    public async rollDamage(
        options: CosmereItem.RollDamageOptions = {},
    ): Promise<DamageRoll[] | null> {
        if (!this.hasDamage() || !this.system.damage.formula) return null;

        // Get the actor to roll for (either assigned through option, the parent of this item, or the first controlled actor)
        const actor =
            options.actor ??
            this.actor ??
            (game.canvas?.tokens?.controlled?.[0]?.actor as
                | CosmereActor
                | undefined);

        // Ensure an actor was found
        if (!actor) {
            ui.notifications.warn(
                game.i18n!.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        const activatable = this.hasActivation();

        // Get the skill id
        const skillId =
            options.skill ??
            (activatable ? this.system.activation.skill : undefined);

        // Get the skill
        const skill = skillId ? actor.system.skills[skillId] : undefined;

        // Get the attribute id
        const attributeId =
            options.attribute ??
            (activatable ? this.system.activation.attribute : undefined) ??
            (skill ? skill.attribute : undefined);

        // Set up data
        const rollData: DamageRollData = this.getDamageRollData(
            skillId,
            attributeId,
            actor,
        );

        // Perform the roll
        const roll = await damageRoll(
            foundry.utils.mergeObject(options, {
                formula:
                    rollData.mod !== undefined
                        ? `${this.system.damage.formula} + ${rollData.mod}`
                        : this.system.damage.formula,
                damageType: this.system.damage.type,
                mod: rollData.mod,
                data: rollData,
                source: this.name,
            }),
        );

        // Gather the formula options for graze rolls
        const unmoddedRoll = roll.clone();
        const diceOnlyRoll = roll.clone();
        rollData.damage = {
            total: roll,
            unmodded: unmoddedRoll,
            dice: diceOnlyRoll,
        };
        unmoddedRoll.removeTermSafely(
            (term) =>
                term instanceof foundry.dice.terms.NumericTerm &&
                term.total === rollData.mod,
        );
        diceOnlyRoll.filterTermsSafely(
            (term) =>
                term instanceof foundry.dice.terms.DiceTerm ||
                term instanceof foundry.dice.terms.OperatorTerm,
        );

        // Ensure there is at least one term in the unmodded roll
        if (unmoddedRoll.terms.length === 0) {
            unmoddedRoll.terms.push(
                new foundry.dice.terms.NumericTerm({ number: 0 }),
            );
            unmoddedRoll.resetFormula();
        }

        // Ensure there is at least one term in the dice only roll
        if (diceOnlyRoll.terms.length === 0) {
            diceOnlyRoll.terms.push(
                new foundry.dice.terms.NumericTerm({ number: 0 }),
            );
            diceOnlyRoll.resetFormula();
        }

        // Get the graze formula
        const grazeFormula =
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            this.system.damage.grazeOverrideFormula || '@damage.dice';

        const usesBaseDamage = grazeFormula.includes('@damage');

        const grazeRoll = await damageRoll(
            foundry.utils.mergeObject(options, {
                formula: grazeFormula,
                damageType: this.system.damage.type,
                data: rollData,
            }),
        );

        // update with results from the basic roll if needed and store for display
        if (usesBaseDamage) grazeRoll.replaceDieResults(roll.dice);

        roll.graze = grazeRoll;

        if (roll && options.chatMessage !== false) {
            // Get the speaker
            const speaker =
                options.speaker ??
                (ChatMessage.getSpeaker({ actor }) as ChatSpeakerData);

            // Create chat message
            await roll.toMessage({
                speaker,
            });
        }

        // Return the roll
        return [roll];
    }

    /**
     * Utility for rolling attacks with this item.
     * This function rolls both the skill test and the damage.
     */
    public async rollAttack(
        options: CosmereItem.RollAttackOptions = {},
    ): Promise<[D20Roll, DamageRoll[]] | null> {
        if (!this.hasActivation()) return null;
        if (!this.hasDamage() || !this.system.damage.formula) return null;

        // Get the actor to roll for (either assigned through option, the parent of this item, or the first controlled actor)
        const actor =
            options.actor ??
            this.actor ??
            (game.canvas?.tokens?.controlled?.[0]?.actor as
                | CosmereActor
                | undefined);

        // Ensure an actor was found
        if (!actor) {
            ui.notifications.warn(
                game.i18n!.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        // Get the skill to use during the skill test
        const skillTestSkillId =
            options.skillTest?.skill ?? this.system.activation.skill;
        if (!skillTestSkillId) return null;

        // Get the skill to use during the damage roll
        const damageSkillId =
            options.damage?.skill ??
            this.system.damage.skill ??
            skillTestSkillId;

        // Get the attribute to use during the skill test
        let skillTestAttributeId: Attribute | None =
            options.skillTest?.attribute ??
            this.system.activation.attribute ??
            NONE;

        // Get the attribute to use during the damage roll
        const damageAttributeId: Attribute | None =
            options.damage?.attribute ??
            this.system.damage.attribute ??
            actor.system.skills[damageSkillId].attribute;

        options.skillTest ??= {};
        options.skillTest.parts ??= this.system.activation.modifierFormula
            ? [this.system.activation.modifierFormula]
            : [];
        options.damage ??= {};

        // Handle key modifiers
        const { fastForward, advantageMode, plotDie } =
            determineConfigurationMode(
                options.configurable,
                options.skillTest.advantageMode
                    ? options.skillTest.advantageMode ===
                          AdvantageMode.Advantage
                    : undefined,
                options.skillTest.advantageMode
                    ? options.skillTest.advantageMode ===
                          AdvantageMode.Disadvantage
                    : undefined,
                options.skillTest.plotDie,
            );

        // Replace config values with key modified values
        options.skillTest.advantageMode = advantageMode;
        options.skillTest.plotDie = plotDie;

        // Perform configuration
        if (!fastForward && options.configurable !== false) {
            const attackConfig = await AttackConfigurationDialog.show({
                title: `${this.name} (${game.i18n!.localize(
                    CONFIG.COSMERE.skills[skillTestSkillId].label,
                )})`,
                skillTest: {
                    ...options.skillTest,
                    parts: ['@mod'].concat(options.skillTest?.parts ?? []),
                    data: this.getSkillTestRollData(
                        skillTestSkillId,
                        skillTestAttributeId,
                        actor,
                    ),
                    plotDie:
                        options.skillTest?.plotDie ??
                        this.system.activation.plotDie,
                },
                damageRoll: {
                    ...options.damage,
                    parts: this.system.damage.formula.split(' + '),
                    data: this.getDamageRollData(
                        skillTestSkillId,
                        skillTestAttributeId,
                        actor,
                    ),
                },
                defaultAttribute: skillTestAttributeId,
                defaultRollMode: options.rollMode,
            });

            // If the dialog was closed, exit out of rolls
            if (!attackConfig) return null;

            options.skillTest.temporaryModifiers =
                attackConfig.skillTest.temporaryModifiers;

            skillTestAttributeId = attackConfig.attribute;
            options.rollMode = attackConfig.rollMode;

            options.skillTest.plotDie = attackConfig.skillTest.plotDie;
            options.skillTest.advantageMode =
                attackConfig.skillTest.advantageMode;
            options.skillTest.advantageModePlot =
                attackConfig.skillTest.advantageModePlot;

            options.damage.advantageMode =
                attackConfig.damageRoll.advantageMode;
        }

        // Roll the skill test
        const skillRoll = (await this.roll({
            ...options.skillTest,
            actor,
            skill: skillTestSkillId,
            attribute: skillTestAttributeId,
            rollMode: options.rollMode,
            speaker: options.speaker,
            configurable: false,
            chatMessage: false,
        }))!;

        // Roll the damage
        const damageRolls = (await this.rollDamage({
            ...options.damage,
            actor,
            skill: damageSkillId,
            attribute: damageAttributeId,
            rollMode: options.rollMode,
            speaker: options.speaker,
            chatMessage: false,
        }))!;

        if (options.chatMessage !== false) {
            // Get the speaker
            const speaker =
                options.speaker ??
                (ChatMessage.getSpeaker({ actor }) as ChatSpeakerData);

            const flavor = game
                .i18n!.localize('COSMERE.Item.AttackFlavor')
                .replace('[actor]', actor.name)
                .replace('[item]', this.name);

            // Create chat message
            const message = (await ChatMessage.create({
                user: game.user!.id,
                speaker,
                content: `<p>${flavor}</p>`,
                rolls: [skillRoll, ...damageRolls],
            })) as ChatMessage;
        }

        // Return the rolls
        return [skillRoll, damageRolls ?? []];
    }

    /**
     * Utility for using activatable items.
     * This function handles resource validation/consumption and dice rolling.
     */
    public async use(
        options: CosmereItem.UseOptions = {},
    ): Promise<D20Roll | [D20Roll, ...DamageRoll[]] | null> {
        if (!this.hasActivation()) return null;

        // Set up post roll actions
        const postRoll: (() => void)[] = [];

        // Get the actor to use this item for
        const actor =
            options.actor ??
            this.actor ??
            (game.canvas?.tokens?.controlled?.[0]?.actor as
                | CosmereActor
                | undefined);

        // Ensure an actor was found
        if (!actor) {
            ui.notifications.warn(
                game.i18n!.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        // Determine whether or not resource consumption is available
        const consumptionAvailable =
            options.shouldConsume !== false && !!this.system.activation.consume;

        // Determine if we should handle resource consumption
        const shouldConsume =
            consumptionAvailable &&
            (options.shouldConsume === true ||
                (await this.showConsumeDialog()));

        // If the dialog was closed, exit out of use action
        if (shouldConsume === null) return null;

        // Handle resource consumption
        if (shouldConsume) {
            const consumeType = this.system.activation.consume!.type;
            const consumeAmount = this.system.activation.consume!.value;

            // The the current amount
            const currentAmount =
                consumeType === ItemConsumeType.Resource
                    ? actor.system.resources[
                          this.system.activation.consume!.resource!
                      ].value
                    : consumeType === ItemConsumeType.Item
                      ? 0 // TODO: Figure out how to handle item consumption
                      : 0;

            // Validate we can consume the amount
            const newAmount = currentAmount - consumeAmount;
            if (newAmount < 0) {
                ui.notifications.warn(
                    game.i18n!.localize('GENERIC.Warning.NotEnoughResource'),
                );
                return null;
            }

            // Add post roll action to consume the resource
            postRoll.push(() => {
                if (consumeType === ItemConsumeType.Resource) {
                    // Handle actor resource consumption
                    void actor.update({
                        system: {
                            resources: {
                                [this.system.activation.consume!
                                    .resource as string]: {
                                    value: newAmount,
                                },
                            },
                        },
                    });
                } else if (consumeType === ItemConsumeType.Item) {
                    // Handle item consumption
                    // TODO: Figure out how to handle item consumption

                    ui.notifications.warn(
                        game
                            .i18n!.localize('GENERIC.Warning.NotImplemented')
                            .replace('[action]', 'Item consumption'),
                    );
                }
            });
        }

        // Handle item uses
        if (this.system.activation.uses) {
            // Get the current uses
            const currentUses = this.system.activation.uses.value;

            // Validate we can use the item
            if (currentUses < 1) {
                ui.notifications.warn(
                    game.i18n!.localize('GENERIC.Warning.NotEnoughUses'),
                );
                return null;
            }

            // Add post roll action to consume a use
            postRoll.push(() => {
                // Handle use consumption
                void this.update({
                    'system.activation.uses.value': currentUses - 1,
                });
            });
        }

        // Handle talent mode activation
        if (this.hasModality() && this.system.modality) {
            // Add post roll action to activate the mode
            postRoll.push(() => {
                // Handle mode activation
                void this.actor?.setMode(this.system.modality!, this.system.id);
            });
        }

        // Check if the item has an attack
        const hasAttack = this.hasAttack();

        // Check if the item has damage
        const hasDamage = this.hasDamage() && this.system.damage.formula;

        // Check if a roll is required
        const rollRequired =
            this.system.activation.type === ActivationType.SkillTest ||
            hasDamage;

        const messageConfig = {
            user: game.user!.id,
            speaker:
                options.speaker ??
                (ChatMessage.getSpeaker({ actor }) as ChatSpeakerData),
            rolls: [] as foundry.dice.Roll[],
            flags: {} as Record<string, unknown>,
        };

        messageConfig.flags[SYSTEM_ID] = {
            message: {
                type: MESSAGE_TYPES.ACTION,
                description: await this.getDescriptionHTML(),
                targets: getTargetDescriptors(),
            },
        };

        if (rollRequired) {
            const rolls: foundry.dice.Roll[] = [];
            let flavor = this.system.activation.flavor;

            if (hasAttack && hasDamage) {
                const attackResult = await this.rollAttack({
                    ...options,
                    actor,
                    skillTest: {
                        parts: options.parts,
                        plotDie: options.plotDie,
                        advantageMode: options.advantageMode,
                        advantageModePlot: options.advantageModePlot,
                        opportunity: options.opportunity,
                        complication: options.complication,
                    },
                    damage: {
                        advantageMode: options.advantageModeDamage,
                    },
                    chatMessage: false,
                });
                if (!attackResult) return null;

                // Add the rolls to the list
                rolls.push(attackResult[0], ...attackResult[1]);

                // Set the flavor
                flavor = flavor
                    ? flavor
                    : `${game.i18n!.localize(
                          `COSMERE.Skill.${attackResult[0].data.skill.id}`,
                      )} (${game.i18n!.localize(
                          `COSMERE.Attribute.${attackResult[0].data.skill.attribute}`,
                      )})`;
            } else {
                if (hasDamage) {
                    const damageRolls = await this.rollDamage({
                        ...options,
                        actor,
                        chatMessage: false,
                    });
                    if (!damageRolls) return null;

                    rolls.push(...damageRolls);
                }

                options.parts ??= this.system.activation.modifierFormula
                    ? [this.system.activation.modifierFormula]
                    : [];
                if (this.system.activation.type === ActivationType.SkillTest) {
                    const roll = await this.roll({
                        ...options,
                        actor,
                        chatMessage: false,
                    });
                    if (!roll) return null;

                    // Add the roll to the list
                    rolls.push(roll);

                    // Set the flavor
                    flavor = flavor
                        ? flavor
                        : `${game.i18n!.localize(
                              `COSMERE.Skill.${roll.data.skill.id}`,
                          )} (${game.i18n!.localize(
                              `COSMERE.Attribute.${roll.data.skill.attribute}`,
                          )})`;
                }
            }

            messageConfig.rolls = rolls;

            // Create chat message
            await ChatMessage.create(messageConfig);

            // Perform post roll actions
            postRoll.forEach((action) => action());

            // Return the result
            return hasDamage
                ? (rolls as [D20Roll, ...DamageRoll[]])
                : (rolls[0] as D20Roll);
        } else {
            // NOTE: Use boolean or operator (`||`) here instead of nullish coalescing (`??`),
            // as flavor can also be an empty string, which we'd like to replace with the default flavor too
            const flavor =
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                this.system.activation.flavor || undefined;

            // Create chat message
            const message = (await ChatMessage.create(
                messageConfig,
            )) as ChatMessage;
            message.applyRollMode('roll');

            // Perform post roll actions
            postRoll.forEach((action) => action());

            return null;
        }
    }

    protected async showConsumeDialog(
        options: ShowConsumeDialogOptions = {},
    ): Promise<boolean | null> {
        if (!this.hasActivation()) return false;
        if (!this.system.activation.consume) return false;

        const consumeType =
            options.consumeType ?? this.system.activation.consume.type;
        const shouldConsume = options.shouldConsume ?? true;
        const amount = this.system.activation.consume.value;
        const title =
            options.title ?? game.i18n!.localize('DIALOG.ItemConsume.Title');

        // Determine consumed resource label
        const consumedResourceLabel =
            consumeType === ItemConsumeType.Resource
                ? game.i18n!.localize(
                      CONFIG.COSMERE.resources[
                          this.system.activation.consume.resource!
                      ].label,
                  )
                : consumeType === ItemConsumeType.Item
                  ? '[TODO ITEM]'
                  : game.i18n!.localize('GENERIC.Unknown');

        // Render the dialog inner HTML
        const content = await renderTemplate(
            CONSUME_CONFIGURATION_DIALOG_TEMPLATE,
            {
                consumedResourceLabel,
                amount,
                shouldConsume,
            },
        );

        // Return promise that resolves with the dialog result
        return new Promise((resolve) => {
            new Dialog({
                title,
                content,
                buttons: {
                    continue: {
                        label: game.i18n!.localize('GENERIC.Button.Continue'),
                        callback: (html) => {
                            const form = $(html)[0].querySelector(
                                'form',
                            )! as HTMLFormElement & {
                                shouldConsume: HTMLInputElement;
                            };

                            resolve(form.shouldConsume.checked);
                        },
                    },
                },
                default: 'continue',
                close: () => resolve(null),
            }).render(true);
        });
    }

    /* --- Functions --- */

    public async recharge() {
        if (!this.hasActivation() || !this.system.activation.uses) return;

        // Recharge resource
        await this.update({
            'system.activation.uses.value': this.system.activation.uses.max,
        });
    }

    public async markFavorite(index: number, render = true) {
        await this.update(
            {
                flags: {
                    [SYSTEM_ID]: {
                        favorites: {
                            isFavorite: true,
                            sort: index,
                        },
                    },
                },
            },
            { render },
        );
    }

    public async clearFavorite() {
        await Promise.all([
            this.unsetFlag(SYSTEM_ID, 'favorites.isFavorite'),
            this.unsetFlag(SYSTEM_ID, 'favorites.sort'),
        ]);
    }

    /* --- Helpers --- */

    protected async getDescriptionHTML(): Promise<string | undefined> {
        if (!this.hasDescription()) return undefined;

        const descriptionData = (this as CosmereItem<DescriptionItemData>)
            .system.description?.value;
        const description = await TextEditor.enrichHTML(descriptionData ?? '');

        const traitsNormal = [];
        const traitsExpert = [];
        const traits = [];
        if (this.hasTraits()) {
            for (const [key, value] of Object.entries(this.system.traits)) {
                if (!value?.active) continue;

                const traitLoc =
                    CONFIG.COSMERE.traits.weaponTraits[key as WeaponTraitId] ??
                    CONFIG.COSMERE.traits.armorTraits[key as ArmorTraitId];
                let label = game.i18n!.localize(traitLoc.label);

                if (value.expertise?.toggleActive) {
                    label = `<strong>${label}</strong>`;
                    traitsExpert.push(label);
                } else {
                    traitsNormal.push(label);
                }
            }

            traits.push(...traitsNormal.sort(), ...traitsExpert.sort());
        }

        let action;
        if (
            this.hasActivation() &&
            this.system.activation?.cost?.value !== undefined
        ) {
            const activation = this.system.activation as Record<
                string,
                unknown
            >;
            const cost = activation.cost as {
                type: ActionCostType;
                value: number;
            };

            switch (cost.type) {
                case ActionCostType.Action:
                    action = `action${Math.min(3, cost.value)}`;
                    break;
                case ActionCostType.Reaction:
                    action = 'reaction';
                    break;
                case ActionCostType.Special:
                    action = 'special';
                    break;
                case ActionCostType.FreeAction:
                    action = 'free';
                    break;
                default:
                    action = 'passive';
                    break;
            }
        }

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_DESCRIPTION,
            {
                title: this.name,
                img: this.img,
                description,
                traits: traits.join(', '),
                action,
            },
        );

        return sectionHTML;
    }

    protected getSkillTestRollData(
        skillId: Skill,
        attributeId: Attribute | None,
        actor: CosmereActor,
    ): D20RollData {
        const skill = actor.system.skills[skillId];
        const attribute =
            attributeId !== NONE
                ? actor.system.attributes[attributeId]
                : { value: 0, bonus: 0 };
        const mod = skill.rank + attribute.value + attribute.bonus;

        return {
            ...actor.getRollData(),
            mod,
            skill: {
                id: skillId,
                rank: skill.rank,
                mod: Derived.getValue(skill.mod) ?? 0,
                attribute: attributeId !== NONE ? attributeId : skill.attribute,
            },
            attribute: attribute.value,
        };
    }

    protected getDamageRollData(
        skillId: Skill | undefined,
        attributeId: Attribute | None | undefined,
        actor: CosmereActor,
    ): DamageRollData {
        const skill = skillId ? actor.system.skills[skillId] : undefined;
        const attribute = attributeId
            ? attributeId !== NONE
                ? actor.system.attributes[attributeId]
                : { value: 0, bonus: 0 }
            : undefined;
        const mod =
            skill !== undefined || attribute !== undefined
                ? (skill?.rank ?? 0) +
                  (attribute?.value ?? 0) +
                  (attribute?.bonus ?? 0)
                : undefined;

        return {
            ...actor.getRollData(),
            mod,
            skill: skill
                ? {
                      id: skillId!,
                      rank: skill.rank,
                      mod: Derived.getValue(skill.mod) ?? 0,
                      attribute:
                          attributeId! !== NONE
                              ? attributeId!
                              : skill.attribute,
                  }
                : undefined,
            attribute: attribute?.value,
        };
    }
}

export namespace CosmereItem {
    export interface RollOptions {
        /**
         * The actor for which to roll this item.
         * Used to determine the modifier for the roll.
         */
        actor?: CosmereActor;

        /**
         * The skill to be used with this item roll.
         * Used to roll the item with an alternate skill.
         */
        skill?: Skill;

        /**
         * The attribute to be used with this item roll.
         * Used to roll the item with an alternate attribute.
         */
        attribute?: Attribute | None;

        /**
         * Whether or not to generate a chat message for this roll.
         *
         * @default true
         */
        chatMessage?: boolean;

        /**
         * Who is sending the chat message for this roll?
         *
         * @default - ChatMessage.getSpeaker({ actor })`
         */
        speaker?: ChatSpeakerData;

        /**
         * Whether or not the roll is configurable.
         * If true, the roll configuration dialog will be shown before the roll.
         */
        configurable?: boolean;

        rollMode?: RollMode;

        /**
         * Whether or not to include a plot die in the roll
         */
        plotDie?: boolean;

        /**
         * The value of d20 result which represents an opportunity
         * @default 20
         */
        opportunity?: number;

        /**
         * The value of d20 result which represent an complication
         * @default 1
         */
        complication?: number;

        /**
         * The dice roll component parts, excluding the initial d20
         *
         * @default []
         */
        parts?: string[];

        /**
         * A dice formula stating any miscellanious other bonuses or negatives to the specific roll
         */
        temporaryModifiers?: string;

        /**
         * What advantage modifier to apply to the roll
         *
         * @default AdvantageMode.None
         */
        advantageMode?: AdvantageMode;

        /**
         * What advantage modifer to apply to the plot die roll
         */
        advantageModePlot?: AdvantageMode;
    }

    export type RollDamageOptions = Omit<
        RollOptions,
        | 'parts'
        | 'opportunity'
        | 'complication'
        | 'plotDie'
        | 'configurable'
        | 'advantageModePlot'
    >;

    export interface RollAttackOptions
        extends Omit<
            RollOptions,
            | 'skill'
            | 'attribute'
            | 'parts'
            | 'opportunity'
            | 'complication'
            | 'plotDie'
            | 'advantageMode'
            | 'advantageModePlot'
        > {
        skillTest?: Pick<
            RollOptions,
            | 'skill'
            | 'attribute'
            | 'parts'
            | 'temporaryModifiers'
            | 'opportunity'
            | 'complication'
            | 'plotDie'
            | 'advantageMode'
            | 'advantageModePlot'
        >;
        damage?: Pick<RollOptions, 'advantageMode' | 'skill' | 'attribute'>;
    }

    export interface UseOptions extends RollOptions {
        /**
         * Whether or not the item usage should consume.
         * Only used if the item has consumption configured.
         */
        shouldConsume?: boolean;

        /**
         * What advantage modifier to apply to the damage roll.
         * Only used if the item has damage configured.
         */
        advantageModeDamage?: AdvantageMode;
    }
}

export type CultureItem = CosmereItem<CultureItemDataModel>;
export type AncestryItem = CosmereItem<AncestryItemDataModel>;
export type PathItem = CosmereItem<PathItemDataModel>;
export type ConnectionItem = CosmereItem<ConnectionItemDataModel>;
export type InjuryItem = CosmereItem<InjuryItemDataModel>;
export type SpecialtyItem = CosmereItem<SpecialtyItemDataModel>;
export type LootItem = CosmereItem<LootItemDataModel>;
export type ArmorItem = CosmereItem<ArmorItemDataModel>;
export type TraitItem = CosmereItem<TraitItemDataModel>;
export type ActionItem = CosmereItem<ActionItemDataModel>;
export type TalentItem = CosmereItem<TalentItemDataModel>;
export type EquipmentItem = CosmereItem<EquipmentItemDataModel>;
export type WeaponItem = CosmereItem<WeaponItemDataModel>;
export type GoalItem = CosmereItem<GoalItemDataModel>;
export type PowerItem = CosmereItem<PowerItemDataModel>;
export type TalentTreeItem = CosmereItem<TalentTreeItemDataModel>;
