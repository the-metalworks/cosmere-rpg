import { CosmereActor, CosmereActorRollData } from './actor';
import { MESSAGE_TYPES } from './chat-message';
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
import { CosmereHooks } from '@system/types/hooks';
import { AnyObject, EmptyObject, DeepPartial } from '@system/types/utils';
import { Rule } from '@system/types/item/event-system';

// Data model
import {
    WeaponItemDataModel,
    ArmorItemDataModel,
    AncestryItemDataModel,
    CultureItemDataModel,
    PathItemDataModel,
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

import {
    ActivatableItemDataSchema,
    ItemConsumeData,
} from '@system/data/item/mixins/activatable';
import { AttackingItemDataSchema } from '@system/data/item/mixins/attacking';
import { DamagingItemDataSchema } from '@system/data/item/mixins/damaging';
import {
    PhysicalItemDataSchema,
    PhysicalItemDerivedData,
} from '@system/data/item/mixins/physical';
import {
    TypedItemDataSchema,
    TypedItemDerivedData,
} from '@system/data/item/mixins/typed';
import {
    TraitsItemDataSchema,
    TraitsItemDerivedData,
} from '@system/data/item/mixins/traits';
import { EquippableItemDataSchema } from '@system/data/item/mixins/equippable';
import { DescriptionItemDataSchema } from '@system/data/item/mixins/description';
import { IdItemDataSchema } from '@system/data/item/mixins/id';
import { ModalityItemDataSchema } from '@system/data/item/mixins/modality';
import {
    TalentsProviderDataSchema,
    TalentsProviderDerivedData,
} from '@system/data/item/mixins/talents-provider';
import { EventsItemDataSchema } from '@system/data/item/mixins/events';
import {
    DeflectItemDataSchema,
    DeflectItemDerivedData,
} from '@system/data/item/mixins/deflect';
import { LinkedSkillsItemDataSchema } from '@system/data/item/mixins/linked-skills';
import {
    RelationshipsItemDataSchema,
    ItemRelationship,
} from '@system/data/item/mixins/relationships';

// Sheet
import { BaseItemSheet } from '@system/applications/item/base';

// Rolls
import {
    d20Roll,
    D20RollOptions,
    damageRoll,
    D20Roll,
    D20RollData,
    DamageRoll,
    DamageRollData,
    D20RollConfigration,
    DamageRollConfiguration,
} from '@system/dice';
import { AdvantageMode } from '@system/types/roll';
import { RollMode } from '@system/dice/types';

// Utils
import {
    determineConfigurationMode,
    getApplyTargets,
    getTargetDescriptors,
} from '@system/utils/generic';
import { EnricherData } from '../utils/enrichers';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { getEmbedHelpers } from '@system/utils/embed';
import ItemRelationshipUtils, {
    RemoveRelationshipOptions,
} from '@src/system/utils/item/relationship';
import { EventToggleOptions } from '@system/utils/item/event-system';

// Dialogs
import { AttackConfigurationDialog } from '@system/applications/dialogs/attack-configuration';
import {
    ItemConsumeDialog,
    ItemConsumeDialogOptions,
} from '@system/applications/item/dialogs/item-consume';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';
import { ItemOrigin } from '../types/item';
import { getObjectChanges } from '@system/utils/data';

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

// export interface CosmereItemData<
//     T extends foundry.abstract.DataSchema = foundry.abstract.DataSchema,
// > {
//     name: string;
//     type: ItemType;
//     system?: T;
// }

class _Item<TSystem extends foundry.abstract.TypeDataModel.Any> extends Item {
    declare type: ItemType;
    // @ts-expect-error Explicitly declare to get proper typing
    declare system: TSystem;
    // @ts-expect-error Explicitly declare to get proper typing
    declare actor: CosmereActor | null;
    // @ts-expect-error Explicitly declare to get proper typing
    declare sheet: BaseItemSheet | null;
}

export class CosmereItem<
    T extends
        foundry.abstract.TypeDataModel.Any = foundry.abstract.TypeDataModel.Any,
> extends _Item<T> {
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

    public isLoot(): this is LootItem {
        return this.type === ItemType.Loot;
    }

    /* --- Mixin type guards --- */

    /**
     * Can this item be activated?
     */
    public hasActivation(): this is ActivatableItem {
        return 'activation' in this.system;
    }

    /**
     * Does this item have an attack?
     */
    public hasAttack(): this is AttackingItem {
        return 'attack' in this.system;
    }

    /**
     * Does this item deal damage?
     */
    public hasDamage(): this is DamagingItem {
        return 'damage' in this.system;
    }

    /**
     * Is this item physical?
     */
    public isPhysical(): this is PhysicialItem {
        return 'weight' in this.system && 'price' in this.system;
    }

    /**
     * Does this item have a sub-type?
     */
    public isTyped(): this is TypedItem {
        return 'type' in this.system;
    }

    /**
     * Does this item have traits?
     * Not to be confused adversary traits. (Which are their own item type.)
     */
    public hasTraits(): this is TraitsItem {
        return 'traits' in this.system;
    }

    /**
     * Does this item have a deflect value?
     */
    public hasDeflect(): this is DeflectItem {
        return 'deflect' in this.system;
    }

    /**
     * Can this item be equipped?
     */
    public isEquippable(): this is EquippableItem {
        return 'equipped' in this.system;
    }

    /**
     * Does this item have a description?
     */
    public hasDescription(): this is DescriptionItem {
        return 'description' in this.system;
    }

    /**
     * Does this item have an id in it system?
     */
    public hasId(): this is IdItem {
        return 'id' in this.system;
    }

    /**
     * Does this item have modality?
     */
    public hasModality(): this is ModalityItem {
        return 'modality' in this.system;
    }

    /**
     * Does this item provide talents?
     */
    public isTalentsProvider(): this is TalentsProviderItem {
        return 'talentTree' in this.system;
    }

    /**
     * Does this item have events?
     */
    public hasEvents(): this is EventsItem {
        return 'events' in this.system;
    }

    /**
     * Whether or not this item supports linked skills.
     */
    public hasLinkedSkills(): this is LinkedSkillsItem {
        return 'linkedSkills' in this.system;
    }

    /**
     * Whether or not this item can have relationships.
     */
    public hasRelationships(): this is RelationshipsItem {
        return 'relationships' in this.system;
    }

    /* --- Accessors --- */

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

    /**
     * Returns a list of all event rules which are currently disabled on this item.
     */
    public get disabledEvents(): Rule[] {
        if (!this.hasEvents()) return [];
        return this.system.events.filter((event) => event.disabled) as Rule[];
    }

    /**
     * Returns a list of all event rules which are currently enabled on this item.
     */
    public get enabledEvents(): Rule[] {
        if (!this.hasEvents()) return [];
        return this.system.events.filter((event) => !event.disabled) as Rule[];
    }

    /* --- Lifecycle --- */

    public override async _onClickDocumentLink(event: MouseEvent) {
        if (!this.sheet)
            return super._onClickDocumentLink(
                event,
            ) as Promise<foundry.applications.api.ApplicationV2.Any>;

        const target = event.currentTarget as HTMLElement;
        await this.sheet.render({ force: true, tab: target.dataset.tab });
        return this
            .sheet as unknown as foundry.applications.api.ApplicationV2.Any;
    }

    protected override _buildEmbedHTML(
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | HTMLCollection | null> {
        const embedHelpers = getEmbedHelpers(this);
        return (
            embedHelpers.buildEmbedHTML?.(this, config, options) ??
            super._buildEmbedHTML(config, options)
        );
    }

    protected override _createInlineEmbed(
        content: HTMLElement | HTMLCollection,
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null> {
        const embedHelpers = getEmbedHelpers(this);
        return (
            embedHelpers.createInlineEmbed?.(this, content, config, options) ??
            super._createInlineEmbed(content, config, options)
        );
    }

    protected override _createFigureEmbed(
        content: HTMLElement | HTMLCollection,
        config: TextEditor.DocumentHTMLEmbedConfig,
        options?: TextEditor.EnrichmentOptions,
    ): Promise<HTMLElement | null> {
        const embedHelpers = getEmbedHelpers(this);
        return (
            embedHelpers.createFigureEmbed?.(this, content, config, options) ??
            super._createFigureEmbed(content, config, options)
        );
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
                game.i18n.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        // Get skill to use
        const skillId = options.skill ?? this.system.activation.resolvedSkill;

        const skill = skillId
            ? actor.system.skills[skillId]
            : { attribute: null, rank: 0 };

        // Get the attribute id
        const attributeId =
            options.attribute ?? this.system.activation.resolvedAttribute;

        // Set up actor data
        const data: D20RollData = this.getSkillTestRollData(
            skillId ? skillId : null,
            attributeId,
            actor,
            options.isAttack,
        );

        const parts = ['@mod'].concat(options.parts ?? []);
        if (options.temporaryModifiers) parts.push(options.temporaryModifiers);

        // Perform the roll
        const roll = await d20Roll(
            foundry.utils.mergeObject(options, {
                data,
                chatMessage: false,
                title: `${this.name} (${
                    skillId
                        ? game.i18n.localize(
                              CONFIG.COSMERE.skills[skillId].label,
                          )
                        : `${game.i18n.localize('GENERIC.Custom')} ${game.i18n.localize('GENERIC.Skill')}`
                })`,
                defaultAttribute: skill.attribute ? skill.attribute : undefined,
                parts: parts,
                plotDie: options.plotDie ?? this.system.activation.plotDie,
                opportunity:
                    options.opportunity ?? this.system.activation.opportunity,
                complication:
                    options.complication ?? this.system.activation.complication,
            }) as D20RollConfigration,
        );

        if (roll && options.chatMessage !== false) {
            // Get the speaker
            const speaker =
                options.speaker ?? ChatMessage.getSpeaker({ actor });

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
                game.i18n.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        const activatable = this.hasActivation();

        // Get the skill id
        const skillId =
            options.skill ??
            (activatable ? this.system.activation.resolvedSkill : null);

        // Get the skill
        const skill = skillId ? actor.system.skills[skillId] : undefined;

        // Get the attribute id
        const attributeId =
            options.attribute ??
            (activatable ? this.system.activation.resolvedAttribute : null);

        // Set up data
        const rollData: DamageRollData = this.getDamageRollData(
            skillId,
            attributeId,
            actor,
        );

        const formula = options.overrideFormula ?? this.system.damage.formula;
        // Perform the roll
        const roll = await damageRoll(
            foundry.utils.mergeObject(options, {
                formula:
                    rollData.mod !== undefined
                        ? `${formula} + ${rollData.mod}`
                        : formula,
                damageType: this.system.damage.type,
                mod: rollData.mod,
                data: rollData,
                source: this.name,
            }) as DamageRollConfiguration,
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
                term instanceof foundry.dice.terms.OperatorTerm ||
                term instanceof foundry.dice.terms.PoolTerm,
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
            // NOTE: Explicitly use logical OR here to also catch empty strings
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            this.system.damage.grazeOverrideFormula || '@damage.dice';

        const usesBaseDamage = grazeFormula.includes('@damage');

        const grazeRoll = await damageRoll(
            foundry.utils.mergeObject(options, {
                formula: grazeFormula,
                damageType: this.system.damage.type,
                data: rollData,
            }) as DamageRollConfiguration,
        );

        // update with results from the basic roll if needed and store for display
        if (usesBaseDamage) grazeRoll.replaceDieResults(roll.dice);

        roll.graze = grazeRoll;

        if (roll && options.chatMessage !== false) {
            // Get the speaker
            const speaker =
                options.speaker ?? ChatMessage.getSpeaker({ actor });

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
                game.i18n.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        // Get the skill to use during the skill test
        const skillTestSkillId =
            options.skillTest?.skill ?? this.system.activation.resolvedSkill;

        // Get the skill to use during the damage roll
        const damageSkillId =
            options.damage?.skill ??
            this.system.damage.skill ??
            skillTestSkillId;

        // Get the attribute to use during the skill test
        let skillTestAttributeId =
            options.skillTest?.attribute ??
            this.system.activation.resolvedAttribute;

        // Get the attribute to use during the damage roll
        const damageAttributeId =
            options.damage?.attribute ??
            this.system.damage.attribute ??
            (damageSkillId
                ? actor.system.skills[damageSkillId].attribute
                : null);

        options.rollMode ??= game.settings.get('core', 'rollMode');
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

        // Get damage formula
        const damageFormula =
            options.damage?.overrideFormula ?? this.system.damage.formula;

        // Perform configuration
        if (!fastForward && options.configurable !== false) {
            /**
             * Hook: preAttackRollConfiguration
             */
            if (
                Hooks.call(
                    HOOKS.PRE_ATTACK_ROLL_CONFIGURATION,
                    options, // Config
                    this, // Source
                ) === false
            )
                return null;

            const parts = ['@mod'].concat(options.skillTest?.parts ?? []);
            if (options.skillTest?.temporaryModifiers)
                parts.push(options.skillTest.temporaryModifiers);

            const attackConfig = await AttackConfigurationDialog.show({
                title: `${this.name} (${
                    skillTestSkillId
                        ? game.i18n.localize(
                              CONFIG.COSMERE.skills[skillTestSkillId].label,
                          )
                        : `${game.i18n.localize('GENERIC.Custom')} ${game.i18n.localize('GENERIC.Skill')}`
                })`,
                defaultAttribute: skillTestAttributeId,
                defaultRollMode: options.rollMode,
                raiseStakes:
                    options.skillTest?.plotDie ??
                    this.system.activation.plotDie,
                skillTest: {
                    ...options.skillTest,
                    parts,
                    data: this.getSkillTestRollData(
                        skillTestSkillId ?? null,
                        skillTestAttributeId,
                        actor,
                        true,
                    ),
                },
                damageRoll: {
                    ...options.damage,
                    parts: damageFormula.split(' + '),
                    data: this.getDamageRollData(
                        skillTestSkillId,
                        skillTestAttributeId,
                        actor,
                    ),
                    dice: [],
                },
                plotDie: {},
            });

            // If the dialog was closed, exit out of rolls
            if (!attackConfig) return null;

            options.skillTest.temporaryModifiers =
                attackConfig.temporaryModifiers;
            skillTestAttributeId = attackConfig.attribute;
            options.rollMode = attackConfig.rollMode;
            options.skillTest.plotDie = attackConfig.plotDie;
            options.skillTest.advantageMode = attackConfig.advantageMode;
            options.skillTest.advantageModePlot =
                attackConfig.advantageModePlot;

            if (
                attackConfig.advantageModeDamage.some(
                    (a) =>
                        (a.advantageMode ?? AdvantageMode.None) !==
                        AdvantageMode.None,
                )
            ) {
                const pools: Record<number, string[]> = {};
                for (const mode of attackConfig.advantageModeDamage) {
                    pools[mode.poolIndex] ??= [];

                    const state = mode.advantageMode ?? AdvantageMode.None;
                    pools[mode.poolIndex].push(
                        `${state !== AdvantageMode.None ? 2 : 1}${mode.die.denomination}${state === AdvantageMode.Advantage ? 'kh' : state === AdvantageMode.Disadvantage ? 'kl' : ''}`,
                    );
                }

                const parts = [];
                for (const pool of Object.values(pools)) {
                    parts.push(
                        pool.length > 1 ? `{${pool.join(',')}}` : pool[0],
                    );
                }

                options.damage.overrideFormula = parts.join(' + ');
            }

            /**
             * Hook: attackRollConfiguration
             */
            Hooks.callAll(
                HOOKS.ATTACK_ROLL_CONFIGURATION,
                options, // Config
                this, // Source
            );
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
            isAttack: true,
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
                options.speaker ?? ChatMessage.getSpeaker({ actor });

            const flavor = game.i18n
                .localize('COSMERE.Item.AttackFlavor')
                .replace('[actor]', actor.name)
                .replace('[item]', this.name);

            // Create chat message
            const message = (await ChatMessage.create(
                {
                    author: game.user.id,
                    speaker,
                    content: `<p>${flavor}</p>`,
                    rolls: [skillRoll, ...damageRolls],
                },
                {
                    rollMode: options.rollMode,
                },
            )) as ChatMessage;
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
                game.i18n.localize('GENERIC.Warning.NoActor'),
            );
            return null;
        }

        options.rollMode ??= game.settings.get('core', 'rollMode');

        const { fastForward, advantageMode, plotDie } =
            determineConfigurationMode(options);

        // Hook: preItemUse
        if (
            Hooks.call(
                HOOKS.PRE_USE_ITEM,
                this, // Source
                {
                    ...options,
                    configurable: !fastForward,
                    advantageMode,
                    plotDie,
                },
            ) === false
        )
            return null;

        // Determine whether or not resource consumption is available
        const consumptionAvailable =
            options.shouldConsume !== false &&
            !!this.system.activation.consume &&
            this.system.activation.consume.length > 0;

        // Determine if we should handle resource consumption
        let consumeResponse: ItemConsumeData[] | null = null;
        if (consumptionAvailable && !options.shouldConsume) {
            consumeResponse = await this.showConsumeDialog();

            // If the dialog was closed, exit out of use action
            if (consumeResponse === null) return null;
        }

        // Handle resource consumption
        if (!!consumeResponse && consumeResponse.length > 0) {
            // Process each included resource consumption
            for (const consumption of consumeResponse) {
                // Get the current amount
                let currentAmount: number;
                switch (consumption.type) {
                    case ItemConsumeType.Resource:
                        currentAmount =
                            actor.system.resources[consumption.resource].value;
                        break;
                    // case ItemConsumeType.Item:
                    // TODO
                    default:
                        currentAmount = 0;
                }

                // Validate that there's enough resource to consume
                const newAmount = currentAmount - consumption.value.actual;
                if (newAmount < 0) {
                    ui.notifications.warn(
                        game.i18n.localize('GENERIC.Warning.NotEnoughResource'),
                    );
                    return null;
                }

                // Add post roll action to consume the resource
                postRoll.push(() => {
                    if (consumption.type === ItemConsumeType.Resource) {
                        // Handle actor resource consumption
                        void actor.update({
                            system: {
                                resources: {
                                    [consumption.resource]: {
                                        value: newAmount,
                                    },
                                },
                            },
                        });
                    } else if (consumption.type === ItemConsumeType.Item) {
                        // Handle item consumption
                        // TODO: Figure out how to handle item consumption

                        ui.notifications.warn(
                            game.i18n
                                .localize('GENERIC.Warning.NotImplemented')
                                .replace('[action]', 'Item consumption'),
                        );
                    }
                });
            }
        }

        // Handle item uses
        if (this.system.activation.uses) {
            // Get the current uses
            const currentUses = this.system.activation.uses.value;

            // Validate we can use the item
            if (currentUses < 1) {
                ui.notifications.warn(
                    game.i18n.localize('GENERIC.Warning.NotEnoughUses'),
                );
                return null;
            }

            // Add post roll action to consume a use
            postRoll.push(() => {
                // Handle use consumption
                void (this as ActivatableItem).update({
                    system: {
                        activation: {
                            uses: {
                                value: currentUses - 1,
                            },
                        },
                    },
                });
            });
        }

        // Handle talent mode activation
        if (
            this.hasId() &&
            this.hasModality() &&
            this.system.modality &&
            !!this.actor
        ) {
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
            user: game.user.id,
            speaker: options.speaker ?? ChatMessage.getSpeaker({ actor }),
            rolls: [] as foundry.dice.Roll[],
            flags: {} as Record<string, unknown>,
        };

        messageConfig.flags[SYSTEM_ID] = {
            message: {
                type: MESSAGE_TYPES.ACTION,
                description: await this.getDescriptionHTML(),
                targets: getTargetDescriptors(),
                item: this.id,
            },
        };

        // Add hook call to post roll actions
        postRoll.push(() => {
            /**
             * Hook: useItem
             */
            Hooks.callAll(
                HOOKS.USE_ITEM,
                this, // Source
                {
                    ...options,
                    configurable: !fastForward,
                    advantageMode,
                    plotDie,
                },
            );
        });

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
                        temporaryModifiers: options.temporaryModifiers,
                    },
                    damage: options.damage ?? {},
                    chatMessage: false,
                });
                if (!attackResult) return null;

                // Add the rolls to the list
                rolls.push(
                    attackResult[0] as unknown as Roll,
                    ...(attackResult[1] as unknown as Roll[]),
                );

                // Set the flavor
                flavor = flavor
                    ? flavor
                    : `${game.i18n.localize(
                          `COSMERE.Skill.${attackResult[0].data.skill.id}`,
                      )} (${game.i18n.localize(
                          `COSMERE.Attribute.${attackResult[0].data.skill.attribute}`,
                      )})`;
            } else {
                if (hasDamage) {
                    const damageRolls = await this.rollDamage({
                        ...options,
                        ...options.damage,
                        actor,
                        chatMessage: false,
                    });
                    if (!damageRolls) return null;

                    rolls.push(...(damageRolls as unknown as Roll[]));
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
                    rolls.push(roll as unknown as Roll);

                    // Set the flavor
                    flavor = flavor
                        ? flavor
                        : `${game.i18n.localize(
                              `COSMERE.Skill.${roll.data.skill.id}`,
                          )} (${game.i18n.localize(
                              `COSMERE.Attribute.${roll.data.skill.attribute}`,
                          )})`;
                }
            }

            messageConfig.rolls = rolls;

            // Create chat message
            await ChatMessage.create(messageConfig, {
                rollMode: options.rollMode,
            });

            // Perform post roll actions
            postRoll.forEach((action) => action());

            // Return the result
            return hasDamage
                ? (rolls as unknown as [D20Roll, ...DamageRoll[]])
                : (rolls[0] as unknown as D20Roll);
        } else {
            // NOTE: Use boolean or operator (`||`) here instead of nullish coalescing (`??`),
            // as flavor can also be an empty string, which we'd like to replace with the default flavor too
            const flavor = this.system.activation.flavor || undefined;

            // Create chat message
            const message = (await ChatMessage.create(messageConfig, {
                rollMode: options.rollMode,
            })) as ChatMessage;

            // Perform post roll actions
            postRoll.forEach((action) => action());

            return null;
        }
    }

    protected async showConsumeDialog(
        options: ShowConsumeDialogOptions = {},
    ): Promise<ItemConsumeData[] | null> {
        if (!this.hasActivation()) return null;
        if (!this.system.activation.consume) return null;

        const consumeOptions = this.system.activation.consume.map(
            (consumptionData, i) => {
                const consumeType = options.consumeType ?? consumptionData.type;
                // Only automatically check first option, or anything overridden.
                const shouldConsume = options.shouldConsume ?? i === 0;
                const amount = consumptionData.value;

                const label =
                    consumeType === ItemConsumeType.Resource
                        ? game.i18n.localize(
                              CONFIG.COSMERE.resources[consumptionData.resource]
                                  .label,
                          )
                        : consumeType === ItemConsumeType.Item
                          ? '[TODO ITEM]'
                          : game.i18n.localize('GENERIC.Unknown');

                return {
                    type: consumeType,
                    resource: label,
                    resourceId: consumptionData.resource ?? 'unknown',
                    amount,
                    shouldConsume,
                };
            },
        );

        // Show the dialog if required
        const result = await ItemConsumeDialog.show(
            this,
            consumeOptions as ItemConsumeDialogOptions[],
        );

        return result?.consumption ?? null;
    }

    /* --- Functions --- */

    public async recharge() {
        if (!this.hasActivation() || !this.system.activation.uses) return;

        // Recharge resource
        await this.update({
            system: {
                activation: {
                    uses: {
                        value: this.system.activation.uses.max,
                    },
                },
            },
        });
    }

    public isRelatedTo(
        item: CosmereItem,
        relType?: ItemRelationship.Type,
    ): boolean {
        if (!this.hasRelationships() || !item.hasRelationships()) return false;

        // Get the relationships of this item
        const relationships = this.system.relationships.filter(
            (r) => r.type === relType || !relType,
        );

        // Check if the item is related to this item
        return relationships.some((rel) => rel.uuid === item.uuid);
    }

    public hasRelationshipOfType(type: ItemRelationship.Type): boolean {
        if (!this.hasRelationships()) return false;

        return this.system.relationships.some(
            (relationship) => relationship.type === type,
        );
    }

    public addRelationship(
        item: CosmereItem,
        type: ItemRelationship.Type,
        removalPolicy?: ItemRelationship.RemovalPolicy,
        source?: false,
    ): Promise<void>;
    public addRelationship(
        item: CosmereItem,
        type: ItemRelationship.Type,
        removalPolicy: ItemRelationship.RemovalPolicy | undefined,
        source: true,
    ): void;
    public addRelationship(
        item: CosmereItem,
        type: ItemRelationship.Type,
        removalPolicy?: ItemRelationship.RemovalPolicy,
        source = false,
    ): Promise<void> | void {
        if (!this.hasRelationships() || !item.hasRelationships()) return;

        return ItemRelationshipUtils.addRelationship(
            this,
            item,
            type,
            removalPolicy,
            source,
        );
    }

    public removeRelationship(
        item: CosmereItem,
        options?: Omit<RemoveRelationshipOptions, 'source'> & {
            source?: false;
        },
    ): Promise<void>;
    public removeRelationship(
        item: CosmereItem,
        options: Omit<RemoveRelationshipOptions, 'source'> & { source: true },
    ): void;
    public removeRelationship(
        item: CosmereItem,
        options?: RemoveRelationshipOptions,
    ): Promise<void> | void {
        if (!this.hasRelationships() || !item.hasRelationships()) return;

        return ItemRelationshipUtils.removeRelationship(this, item, options);
    }

    public async disableEvents(
        this: CosmereItem,
        options?: EventToggleOptions,
    ): Promise<void> {
        if (!this.hasEvents()) return undefined;

        const events = this.system.events;
        for (const event of events) {
            if (
                event.disabled ||
                (options?.filter && !options.filter(event as Rule))
            )
                continue;
            event.disabled = true;
        }
        await this.update({ system: { events } });
    }

    public async enableEvents(
        this: CosmereItem,
        options?: EventToggleOptions,
    ): Promise<void> {
        if (!this.hasEvents()) return undefined;

        const events = this.system.events;
        for (const event of events) {
            if (
                !event.disabled ||
                (options?.filter && !options.filter(event as Rule))
            )
                continue;
            event.disabled = false;
        }
        await this.update({ system: { events } });
    }

    /* --- Helpers --- */

    protected async getDescriptionHTML(): Promise<string | undefined> {
        if (!this.hasDescription()) return undefined;
        // NOTE: We use logical OR's here to catch both nullish values and empty string
        const descriptionData =
            this.system.description?.chat ||
            this.system.description?.short ||
            this.system.description?.value;

        const description = await foundry.applications.ux.TextEditor.enrichHTML(
            descriptionData ?? '',
            {
                relativeTo: this.system.parent as foundry.abstract.Document.Any,
            },
        );

        const traitsNormal = [];
        const traitsExpert = [];
        const traits = [];
        if (this.hasTraits()) {
            for (const [key, value] of Object.entries(this.system.traits)) {
                if (!value?.active) continue;

                const traitLoc =
                    CONFIG.COSMERE.traits.weaponTraits[key as WeaponTraitId] ??
                    CONFIG.COSMERE.traits.armorTraits[key as ArmorTraitId];
                let label = game.i18n.localize(traitLoc.label);

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
        if (this.hasActivation() && this.system.activation.cost.value) {
            switch (this.system.activation.cost.type) {
                case ActionCostType.Action:
                    action = `action${Math.min(3, this.system.activation.cost.value)}`;
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
        skillId: Skill | null,
        attributeId: Attribute | null,
        actor: CosmereActor,
        isAttack?: boolean,
    ): D20RollData {
        const skill = skillId
            ? actor.system.skills[skillId]
            : { attribute: null, rank: 0, mod: 0 };
        const attribute = attributeId
            ? actor.system.attributes[attributeId]
            : { value: 0, bonus: 0 };
        const mod = skill.rank + attribute.value + attribute.bonus;

        return {
            ...actor.getRollData(),
            mod,
            skill: {
                id: skillId ?? null,
                rank: skill.rank,
                mod:
                    typeof skill.mod === 'number' ? skill.mod : skill.mod.value,
                attribute: attributeId ? attributeId : skill.attribute,
            },
            attribute: attribute.value,

            // Hook data
            context: isAttack ? 'Attack' : 'Item',
            source: this,
        };
    }

    protected getDamageRollData(
        skillId: Skill | null | undefined,
        attributeId: Attribute | null | undefined,
        actor: CosmereActor,
    ): DamageRollData {
        const skill = skillId ? actor.system.skills[skillId] : undefined;
        const attribute = attributeId
            ? attributeId
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
                      mod: skill.mod.value,
                      attribute: attributeId! ? attributeId : skill.attribute,
                  }
                : undefined,
            attribute: attribute?.value,

            // Hook data
            source: this,
        };
    }

    public getRollData() {
        return foundry.utils.mergeObject(super.getRollData(), {
            actor: this.actor?.getRollData(),
        });
    }

    public getEnricherData() {
        let actor = undefined;
        if (this.actor) {
            actor = this.actor.getRollData();
        }
        const targets = getTargetDescriptors();

        return {
            actor,
            item: {
                name: this.name,
                charges: this.hasActivation()
                    ? {
                          value:
                              (this as unknown as ActivatableItem).system
                                  .activation.uses?.value ?? 0,
                          max:
                              (this as unknown as ActivatableItem).system
                                  .activation.uses?.max ?? 0,
                      }
                    : undefined,
            },
            target: targets.length > 0 ? targets[0] : undefined,
        } as const satisfies EnricherData;
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
        skill?: Skill | null;

        /**
         * The attribute to be used with this item roll.
         * Used to roll the item with an alternate attribute.
         */
        attribute?: Attribute | null;

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
        speaker?: ChatMessage.SpeakerData;

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
         * A formula to override the default formula passed in for the damage roll.
         * Used when configuring individual dice in a damage roll with advantage/disadvantage.
         */
        overrideFormula?: string;

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

        /**
         * Whether the current roll is an attack, for hook context
         */
        isAttack?: boolean;
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
            | 'temporaryModifiers'
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
        damage?: Pick<RollOptions, 'overrideFormula' | 'skill' | 'attribute'>;
    }

    export interface UseOptions
        extends RollOptions,
            Pick<RollAttackOptions, 'damage'> {
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

    export type RollData<T extends AnyObject = AnyObject> = T & {
        actor?: CosmereActorRollData;
    };
}

export type CultureItem = CosmereItem<CultureItemDataModel>;
export type AncestryItem = CosmereItem<AncestryItemDataModel>;
export type PathItem = CosmereItem<PathItemDataModel>;
export type ConnectionItem = CosmereItem<ConnectionItemDataModel>;
export type InjuryItem = CosmereItem<InjuryItemDataModel>;
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

export type CosmereItemFromSchema<
    TSchema extends foundry.data.fields.DataSchema,
    TBaseData extends AnyObject = EmptyObject,
    TDerivedData extends AnyObject = EmptyObject,
> = CosmereItem<
    foundry.abstract.TypeDataModel<
        TSchema,
        foundry.documents.BaseItem,
        TBaseData,
        TDerivedData
    >
>;

export type ActivatableItem = CosmereItemFromSchema<ActivatableItemDataSchema>;
export type AttackingItem = CosmereItemFromSchema<AttackingItemDataSchema>;
export type DamagingItem = CosmereItemFromSchema<DamagingItemDataSchema>;
export type DescriptionItem = CosmereItemFromSchema<DescriptionItemDataSchema>;
export type PhysicialItem = CosmereItemFromSchema<
    PhysicalItemDataSchema,
    EmptyObject,
    PhysicalItemDerivedData
>;
export type TypedItem = CosmereItemFromSchema<
    TypedItemDataSchema,
    EmptyObject,
    TypedItemDerivedData
>;
export type TraitsItem = CosmereItemFromSchema<
    TraitsItemDataSchema,
    EmptyObject,
    TraitsItemDerivedData
>;
export type DeflectItem = CosmereItemFromSchema<
    DeflectItemDataSchema,
    EmptyObject,
    DeflectItemDerivedData
>;
export type EquippableItem = CosmereItemFromSchema<EquippableItemDataSchema>;
export type IdItem = CosmereItemFromSchema<IdItemDataSchema>;
export type ModalityItem = CosmereItemFromSchema<ModalityItemDataSchema>;
export type TalentsProviderItem = CosmereItemFromSchema<
    TalentsProviderDataSchema,
    EmptyObject,
    TalentsProviderDerivedData
>;
export type EventsItem = CosmereItemFromSchema<EventsItemDataSchema>;
export type LinkedSkillsItem =
    CosmereItemFromSchema<LinkedSkillsItemDataSchema>;
export type RelationshipsItem =
    CosmereItemFromSchema<RelationshipsItemDataSchema>;

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface ConfiguredItem<SubType extends Item.SubType> {
        document: CosmereItem;
    }

    interface FlagConfig {
        Item: {
            [SYSTEM_ID]: {
                sheet: {
                    mode: 'edit' | 'view';
                };
                'sheet.mode': 'edit' | 'view';
                meta: {
                    origin: ItemOrigin;
                };
                'meta.origin': ItemOrigin;
                previousLevel?: number;
                isStartingPath?: boolean;
            };
        };
    }
}
