import { CosmereActor } from './actor';
import {
    ItemType,
    Skill,
    Attribute,
    ItemConsumeType,
    WeaponTraitId,
    ArmorTraitId,
    ActionCostType,
    ActivationType,
    EffectListType,
    ItemResource,
    WeaponType,
    DamageType,
} from '@system/types/cosmere';
import { CosmereHooks } from '@system/types/hooks';
import { AnyObject, EmptyObject, DeepPartial } from '@system/types/utils';
import { Rule } from '@system/types/item/event-system';

import type { EmbeddedDocumentsConfig } from './embed-config/types';
import type { EphemeralEmbeddedDocumentsConfig } from './ephemeral-embeds/types';

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
    EffectsContainerItemDataModel,
    TraitItemDataSchema,
} from '@system/data/item';

import { AttackingItemDataSchema } from '@system/data/item/mixins/attacking';
import { StrikingItemDataSchema } from '../data/item/mixins/striking';
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
import { ResourcesItemMixin } from '../data/item/mixins/resources';

// Sheet
import { BaseItemSheet } from '@system/applications/item/base';
import { CosmereActiveEffect } from '.';

// Rolls
import {
    CosmereDamageRoll,
    CosmereDamageRollData,
    CosmereDamageRollOptions,
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
    CosmereSkillRollOptions,
} from '../dice';
import { CosmereGrazeRoll } from '../dice/rolls/cosmere-roll-graze';

// Utils
import {
    determineConfigurationMode,
    getApplyTargets,
    getTargetDescriptors,
    resolveSkill,
    resolveAttribute,
} from '@system/utils/generic';
import { EnricherData } from '@system/utils/enrichers';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { getEmbedHelpers } from '@system/utils/embed';
import ItemRelationshipUtils, {
    RemoveRelationshipOptions,
} from '@system/utils/item/relationship';
import { matchDocuments, DocumentTarget } from '@system/utils/match-document';
import { EventToggleOptions } from '@system/utils/item/event-system';

// Dialogs
import { ItemConsumeDialog } from '@system/applications/item/dialogs/item-consume';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';
import { ItemOrigin } from '@system/types/item';

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

class _Item<
    const TSystem extends foundry.abstract.TypeDataModel.Any,
> extends Item<'base'> {
    declare static metadata: foundry.abstract.Document.MetadataFor<'Item'> & {
        embeddedConfig: EmbeddedDocumentsConfig<'Item'>;
        ephemeralEmbedded: EphemeralEmbeddedDocumentsConfig<'Item'>;
    };

    // @ts-expect-error Explicitly declare to get proper typing
    declare type: ItemType;
    // @ts-expect-error Explicitly declare to get proper typing
    declare system: TSystem;
    // @ts-expect-error Explicitly declare to get proper typing
    declare sheet: BaseItemSheet | null;

    declare items: foundry.abstract.EmbeddedCollection<CosmereItem, this>;

    public get actor(): CosmereActor | null {
        return this.parent instanceof CosmereActor
            ? this.parent
            : this.parent instanceof CosmereItem
              ? this.parent.actor
              : null;
    }
}

export class CosmereItem<
    T extends
        foundry.abstract.TypeDataModel.Any = foundry.abstract.TypeDataModel.Any,
> extends _Item<T> {
    static metadata = Object.freeze(
        foundry.utils.mergeObject(
            super.metadata,
            {
                embeddedConfig: {
                    base: {
                        Item: {
                            // Allow actions to be embedded in items by default, but disallow all other item types
                            base: false,
                            action: true,
                        },
                    },
                    action: {
                        Item: false, // Disable embedding of items in action items
                    },
                    connection: {
                        Item: false, // Disable embedding of items in connection items
                    },
                    goal: {
                        Item: false, // Disable embedding of items in goal items
                    },
                    injury: {
                        Item: false, // Disable embedding of items in injury items
                    },
                    loot: {
                        Item: false, // Disable embedding of items in loot items
                    },
                    talent_tree: {
                        Item: false, // Disable embedding of items in talent tree items
                    },
                } as EmbeddedDocumentsConfig<'Item'>,
                // Note: Cannot bind due to static context. Calls are bound safely by mixin.
                /* eslint-disable @typescript-eslint/unbound-method */
                ephemeralEmbedded: {
                    weapon: {
                        Item: CosmereItem.prepareEphemeralItems,
                    },
                },
                /* eslint-enable @typescript-eslint/unbound-method */
            },
            { inplace: false },
        ),
    );

    /* --- ItemType type guards --- */

    public isWeapon(): this is WeaponItem {
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

    public isAction(): this is ActionItem {
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

    public isEffectsContainer(): this is CosmereItem<EffectsContainerItemDataModel> {
        return this.type === ItemType.EffectsContainer;
    }

    public isTalentTree(): this is CosmereItem<TalentTreeItemDataModel> {
        return this.type === ItemType.TalentTree;
    }

    public isLoot(): this is LootItem {
        return this.type === ItemType.Loot;
    }

    /* --- Mixin type guards --- */

    /**
     * Does this item have an attack?
     */
    public hasAttack(): this is AttackingItem {
        return 'attack' in this.system;
    }

    /**
     * Does this item have a strike?
     */
    public hasStrike(): this is StrikingItem {
        return 'strike' in this.system;
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
     * Does this item have equippable data?
     */
    public isEquippableItem(): this is EquippableItem {
        return 'equipped' in this.system;
    }

    /**
     * Can this item be equipped?
     */
    public isEquippable(): this is EquippableItem {
        return this.isEquippableItem() && this.system.equippableEnabled;
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

    /**
     * Whether or not this item has resources that can be consumed.
     */
    public hasResources(): this is ResourcesItem {
        return 'resources' in this.system;
    }

    /* --- Accessors --- */

    public get root(): CosmereItem {
        return this.parent instanceof CosmereItem ? this.parent.root : this;
    }

    public get isSpecialWeapon(): boolean {
        if (!this.isWeapon()) {
            return false;
        }
        return this.system.type === WeaponType.Special;
    }

    public get isStrikeAction(): boolean {
        return this.isDefaultAction && !!this.getFlag(SYSTEM_ID, 'isStrike');
    }

    public get isEphemeral(): boolean {
        return !foundry.utils.getProperty(this, '_stats.createdTime');
    }

    public get isActivatable(): boolean {
        if (this.type === ItemType.Action) return true;

        const embeddedConfig = (this.constructor as typeof CosmereItem).metadata
            .embeddedConfig;
        const configForType =
            embeddedConfig[this.type] ?? embeddedConfig.base ?? {};

        if (configForType.Item === false) return false;

        const actionConfig =
            configForType.Item!.action ?? configForType.Item!.base ?? true;

        return actionConfig !== false;
    }

    public get hasActions(): boolean {
        return this.actions.length > 0;
    }

    /**
     * Whether or not this item has actions that are currently usable for the character.
     * Currently checks equipped state for equippable items.
     */
    public get hasUsableActions(): boolean {
        return !this.isEquippable() || this.system.equipped
            ? this.hasActions
            : false;
    }

    public get actions(): readonly ActionItem[] {
        return this.items.filter((item) => item.isAction());
    }

    public get defaultAction(): ActionItem | null {
        return this.actions.at(0) ?? null;
    }

    public get allEmbeddedItems(): readonly CosmereItem[] {
        if (this.items) {
            return Array.from(this.items).flatMap((item) => [
                item,
                ...item.allEmbeddedItems,
            ]);
        } else return [];
    }

    /**
     * Whether or not this action is the default for its parent item.
     * Only available for action items that are embedded in other items.
     */
    public get isDefaultAction(): boolean {
        if (
            !this.isAction() ||
            !this.parent ||
            !(this.parent instanceof CosmereItem)
        )
            return false;
        return this.defaultAction?.id === this.id;
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

    /**
     * Returns true if any resource on the item has a recharge configured
     */
    public get hasRecharge(): boolean {
        if (!this.hasResources()) return false;
        let hasRecharge = false;
        for (const resource of Object.values(this.system.resources)) {
            if (!!resource?.recharge && resource.recharge !== 'none') {
                hasRecharge = true;
                break;
            }
        }
        return hasRecharge;
    }

    /**
     * Returns true if effects list is not empty, or if there are nested effects
     */
    public get hasEffects(): boolean {
        return !!this.allEffects.length;
    }

    /**
     * Returns a list of all effects which match the supplied type
     */
    public getEffectsOfType(type: EffectListType): CosmereActiveEffect[] {
        switch (type) {
            case EffectListType.Inactive:
                return this.inactiveEffects;
            case EffectListType.Passive:
                return this.passiveEffects;
            case EffectListType.Temporary:
                return this.temporaryEffects;
            default:
                return [];
        }
    }

    /**
     * Returns a list of all non-temporary effects which are active
     */
    public get passiveEffects(): CosmereActiveEffect[] {
        return this.hasEffects
            ? this.allEffects.filter(
                  (effect) => effect.active && !effect.isTemporary,
              )
            : [];
    }

    /**
     * Returns a list of all effects which are inactive
     */
    public get inactiveEffects(): CosmereActiveEffect[] {
        return this.hasEffects
            ? this.allEffects.filter((effect) => !effect.active)
            : [];
    }

    /**
     * Returns a list of all temporary effects which are active
     */
    public get temporaryEffects(): CosmereActiveEffect[] {
        return this.hasEffects
            ? this.allEffects.filter(
                  (effect) => effect.active && effect.isTemporary,
              )
            : [];
    }

    /**
     * Returns true if even a single passive effect exists on the item
     */
    public hasEffectOfType(type: EffectListType): boolean {
        switch (type) {
            case EffectListType.Inactive:
                return this.hasInactiveEffect;
            case EffectListType.Passive:
                return this.hasPassiveEffect;
            case EffectListType.Temporary:
                return this.hasTemporaryEffect;
            default:
                return false;
        }
    }

    /**
     * Returns true if even a single passive effect exists on the item
     */
    public get hasPassiveEffect(): boolean {
        return !!this.passiveEffects.length;
    }

    /**
     * Returns true if even a single inactive effect exists on the item
     */
    public get hasInactiveEffect(): boolean {
        return !!this.inactiveEffects.length;
    }

    /**
     * Returns true if even a single temporary effect exists on the item
     */
    public get hasTemporaryEffect(): boolean {
        return !!this.temporaryEffects.length;
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

    public get strikeAction(): ActionItem | null {
        if (!this.isWeapon()) return null;

        const strike = this.actions.find(
            (action) =>
                action.system.id === `strike-${this.system.id}` &&
                action.isStrikeAction,
        );

        // Strike action is ephemeral and should always exist
        if (!strike)
            throw new Error(
                'Invalid Item state. Unable to find strike action.',
            );

        return strike;
    }

    public get nestedEffects(): ActiveEffect.Implementation[] {
        return this.items
            .map((item) => [...item.effects, ...item.nestedEffects])
            .flat();
    }

    public get allEffects(): ActiveEffect.Implementation[] {
        return [...this.effects.contents, ...this.nestedEffects];
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

    protected _preUpdate(
        changed: Item.UpdateData,
        options: Item.Database.PreUpdateOptions,
        user: User.Implementation,
    ): Promise<boolean | void> {
        if (
            this.isWeapon() &&
            this.hasStrike() &&
            foundry.utils.hasProperty(changed, 'system.strike.skill')
        ) {
            const changes = changed as Partial<WeaponItem>;
            const weaponType = changes.system?.type ?? this.system.type;
            if (
                !!changes.system?.strike &&
                weaponType !== WeaponType.Special &&
                (changes.system.strike.skillLocked ||
                    this.system.strike.skillLocked)
            ) {
                const strike = foundry.utils.mergeObject(
                    changes.system.strike,
                    { skill: this.weaponTypeToSkill(weaponType) },
                );

                changes.system.strike = foundry.utils.mergeObject(
                    this.system.strike,
                    strike,
                );
            }
        }

        return super._preUpdate(changed, options, user);
    }

    protected static prepareEphemeralItems(this: CosmereItem): CosmereItem[] {
        if (!this.isWeapon()) return [];

        return [
            ...this.getWeaponStrikeData().map((data) => new CosmereItem(data)),
        ];
    }

    /* --- Roll & Usage utilities --- */

    /**
     * Utility for using activatable items.
     * This function handles resource validation/consumption and dice rolling.
     */
    public async use(options: CosmereRollOptions = {}): Promise<CosmereRoll[]> {
        if (!this.isAction()) return [];

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
            return [];
        }

        // Set up post roll actions
        const postRoll: (() => void)[] = [];

        // // Hook: preItemUse
        // if (
        //     Hooks.call(
        //         HOOKS.PRE_USE_ITEM,
        //         this, // Source
        //         {
        //             ...options,
        //             configurable: !fastForward,
        //             advantageMode,
        //             plotDie,
        //         },
        //     ) === false
        // )
        //     return null;

        // Determine whether or not resource consumption is available
        const consumptionAvailable =
            !!this.system.activation!.consumption &&
            this.system.activation!.consumption.length > 0;

        // Determine if we should handle resource consumption
        let consumeResponse: ActionItemDataModel.ConsumeData[] | null = null;
        if (consumptionAvailable && !options.consume) {
            consumeResponse = await ItemConsumeDialog.show(this);

            // If the dialog was closed, exit out of use action
            if (consumeResponse === null) return [];
        }

        // Handle resource consumption
        if (!!consumeResponse && consumeResponse.length > 0) {
            // Add consumption data to the options for hook usage
            options.consumeResponse = consumeResponse;

            // Process each included resource consumption
            for (const consumption of consumeResponse) {
                const targets =
                    consumption.type === ItemConsumeType.Resource ||
                    consumption.type === ItemConsumeType.ItemResource
                        ? await matchDocuments({
                              ...consumption.matchDocument,
                              relativeTo: this,
                          })
                        : null;

                if (!targets) {
                    ui.notifications.warn(
                        game.i18n.localize('GENERIC.Warning.NotEnoughResource'),
                    );
                    return [];
                }

                for (const target of targets) {
                    // Get the current amount
                    let currentAmount = 0;

                    if (
                        consumption.type === ItemConsumeType.Resource &&
                        CosmereActor.isInstance(target)
                    ) {
                        currentAmount =
                            target.system.resources[consumption.resource].value;
                    } else if (
                        consumption.type === ItemConsumeType.ItemResource &&
                        target instanceof CosmereItem &&
                        target.hasResources() &&
                        target.system.resources[consumption.resource]
                    ) {
                        currentAmount =
                            target.system.resources[consumption.resource].value;
                    }

                    // Validate that there's enough resource to consume
                    const newAmount = currentAmount - consumption.value.actual;
                    if (newAmount < 0) {
                        ui.notifications.warn(
                            game.i18n.localize(
                                'GENERIC.Warning.NotEnoughResource',
                            ),
                        );
                        return [];
                    }

                    // Add post roll action to consume the resource
                    postRoll.push(() => {
                        if (
                            consumption.type === ItemConsumeType.Resource ||
                            consumption.type === ItemConsumeType.ItemResource
                        ) {
                            // Handle actor resource consumption
                            void (target as CosmereActor | CosmereItem).update({
                                system: {
                                    resources: {
                                        [consumption.resource]: {
                                            value: newAmount,
                                        },
                                    },
                                },
                            });
                        }
                        // } else if (consumption.type === ItemConsumeType.Item) {
                        //     // Handle item consumption
                        //     // TODO: Figure out how to handle item consumption

                        //     ui.notifications.warn(
                        //         game.i18n
                        //             .localize('GENERIC.Warning.NotImplemented')
                        //             .replace('[action]', 'Item consumption'),
                        //     );
                        // }
                    });
                }
            }
        }

        // Handle talent mode activation
        if (
            this.hasId() &&
            this.hasModality() &&
            this.system.modality &&
            !!actor
        ) {
            // Add post roll action to activate the mode
            postRoll.push(() => {
                void actor.setMode(this.system.modality!, this.system.id);
            });
        }

        const hasSkillTest =
            this.system.activation!.type === ActivationType.SkillTest &&
            this.system.skillTest.resolvedSkill !== null;

        // Check if the item has damage
        const hasDamage =
            this.hasDamage() &&
            this.system.damage.formula &&
            (this.system.damage.resolvedSkill !== null ||
                this.system.skillTest.resolvedSkill != null);

        // Add hook call to post roll actions
        // postRoll.push(() => {
        //     /**
        //      * Hook: useItem
        //      */
        //     Hooks.callAll(
        //         HOOKS.USE_ITEM,
        //         this, // Source
        //         {
        //             ...options,
        //             configurable: !fastForward,
        //             advantageMode,
        //             plotDie,
        //         },
        //     );
        // });

        const rolls: CosmereRoll[] = [];

        if (hasSkillTest) {
            const skillOptions = foundry.utils.mergeObject(options, {
                attribute: this.system.skillTest.resolvedAttribute ?? undefined,
                // We don't want the item setting for raise stakes to override previous choices (e.g. the fast forward raise stakes hotkey)
                raiseStakes:
                    ((options as CosmereSkillRollOptions).raiseStakes ??
                        false) ||
                    (this.system.skillTest.plotDie ?? false),
            });

            rolls.push(
                ...actor.generateSkillTest(
                    this.system.skillTest.resolvedSkill!,
                    skillOptions,
                    this,
                ),
            );
        }

        if (hasDamage) {
            const data = this.getRollData() as CosmereDamageRollData;

            data.skill =
                (options as CosmereDamageRollOptions).skill ??
                this.system.damage.resolvedSkill ??
                this.system.skillTest.resolvedSkill!;
            const skill = actor.system.skills[data.skill];

            data.attribute =
                (options as CosmereDamageRollOptions).attribute ??
                this.system.damage.resolvedAttribute ??
                this.system.skillTest.resolvedAttribute!;
            const attribute = actor.system.attributes[data.attribute];

            data.mod = data.attribute
                ? attribute.value +
                  attribute.bonus +
                  skill.rank +
                  skill.mod.bonus
                : skill.mod.value;

            data.parts = [this.system.damage.formula!, '@mod'];
            data.type = this.system.damage.type ?? undefined;

            const damageRoll = new CosmereDamageRoll(
                data.parts.join(' + '),
                data,
                options,
            );
            rolls.push(damageRoll);

            if (this.system.damage.grazeOverrideFormula) {
                const grazeData = foundry.utils.deepClone(data);
                grazeData.parts = [this.system.damage.grazeOverrideFormula];
                grazeData.parent = damageRoll.uuid;

                rolls.push(
                    new CosmereGrazeRoll(
                        grazeData.parts.join(' + '),
                        grazeData,
                        options,
                    ),
                );
            }
        }

        // Perform post roll actions
        postRoll.forEach((action) => action());

        return rolls;

        // options.rollMode ??= game.settings.get('core', 'rollMode');

        // const { fastForward, advantageMode, plotDie } =
        //     determineConfigurationMode(options);

        // // Check if the item has an attack
        // const hasAttack = this.hasAttack();

        // // Check if the item has damage
        // const hasDamage = this.hasDamage() && this.system.damage.formula;

        // // Check if a roll is required
        // const rollRequired =
        //     this.system.activation.type === ActivationType.SkillTest ||
        //     hasDamage;

        // const messageConfig = {
        //     user: game.user.id,
        //     speaker: options.speaker ?? ChatMessage.getSpeaker({ actor }),
        //     rolls: [] as foundry.dice.Roll[],
        //     flags: {} as Record<string, unknown>,
        // };

        // messageConfig.flags[SYSTEM_ID] = {
        //     message: {
        //         type: MESSAGE_TYPES.ACTION,
        //         description: await this.getDescriptionHTML(),
        //         targets: getTargetDescriptors(),
        //         item: this.id,
        //     },
        // };

        // // Add hook call to post roll actions
        // postRoll.push(() => {
        //     /**
        //      * Hook: useItem
        //      */
        //     Hooks.callAll(
        //         HOOKS.USE_ITEM,
        //         this, // Source
        //         {
        //             ...options,
        //             configurable: !fastForward,
        //             advantageMode,
        //             plotDie,
        //         },
        //     );
        // });

        // if (rollRequired) {
        //     const rolls: foundry.dice.Roll[] = [];
        //     let flavor = this.system.activation.flavor;

        //     if (hasAttack && hasDamage) {
        //         const attackResult = await this.rollAttack({
        //             ...options,
        //             actor,
        //             skillTest: {
        //                 parts: options.parts,
        //                 plotDie: options.plotDie,
        //                 advantageMode: options.advantageMode,
        //                 advantageModePlot: options.advantageModePlot,
        //                 opportunity: options.opportunity,
        //                 complication: options.complication,
        //                 temporaryModifiers: options.temporaryModifiers,
        //             },
        //             damage: options.damage ?? {},
        //             chatMessage: false,
        //         });
        //         if (!attackResult) return null;

        //         // Add the rolls to the list
        //         rolls.push(
        //             attackResult[0] as unknown as Roll,
        //             ...(attackResult[1] as unknown as Roll[]),
        //         );

        //         // Set the flavor
        //         flavor = flavor
        //             ? flavor
        //             : `${game.i18n.localize(
        //                   `COSMERE.Skill.${attackResult[0].data.skill.id}`,
        //               )} (${game.i18n.localize(
        //                   `COSMERE.Attribute.${attackResult[0].data.skill.attribute}`,
        //               )})`;
        //     } else {
        //         if (hasDamage) {
        //             const damageRolls = await this.rollDamage({
        //                 ...options,
        //                 ...options.damage,
        //                 actor,
        //                 chatMessage: false,
        //             });
        //             if (!damageRolls) return null;

        //             rolls.push(...(damageRolls as unknown as Roll[]));
        //         }

        //         options.parts ??= this.system.activation.modifierFormula
        //             ? [this.system.activation.modifierFormula]
        //             : [];
        //         if (this.system.activation.type === ActivationType.SkillTest) {
        //             const roll = await this.roll({
        //                 ...options,
        //                 actor,
        //                 chatMessage: false,
        //             });
        //             if (!roll) return null;

        //             // Add the roll to the list
        //             rolls.push(roll as unknown as Roll);

        //             // Set the flavor
        //             flavor = flavor
        //                 ? flavor
        //                 : `${game.i18n.localize(
        //                       `COSMERE.Skill.${roll.data.skill.id}`,
        //                   )} (${game.i18n.localize(
        //                       `COSMERE.Attribute.${roll.data.skill.attribute}`,
        //                   )})`;
        //         }
        //     }

        //     messageConfig.rolls = rolls;

        //     // Create chat message
        //     await ChatMessage.create(messageConfig, {
        //         rollMode: options.rollMode,
        //     });

        //     // Perform post roll actions
        //     postRoll.forEach((action) => action());

        //     // Return the result
        //     return hasDamage
        //         ? (rolls as unknown as [D20Roll, ...DamageRoll[]])
        //         : (rolls[0] as unknown as D20Roll);
        // } else {
        //     // NOTE: Use boolean or operator (`||`) here instead of nullish coalescing (`??`),
        //     // as flavor can also be an empty string, which we'd like to replace with the default flavor too
        //     const flavor = this.system.activation.flavor || undefined;

        //     // Create chat message
        //     const message = (await ChatMessage.create(messageConfig, {
        //         rollMode: options.rollMode,
        //     })) as ChatMessage;

        //     // Perform post roll actions
        //     postRoll.forEach((action) => action());

        //     return null;
        // }
    }

    /* --- Functions --- */

    public async toChatMessage(
        options: CosmereItem.ToChatMessageOptions = {},
    ): Promise<ChatMessage> {
        const messageConfig = {
            user: game.user.id,
            speaker:
                options.speaker ??
                ChatMessage.getSpeaker({ actor: options.actor }),
            rolls: [] as foundry.dice.Roll[],
            flags: {} as Record<string, unknown>,
        };

        messageConfig.flags[SYSTEM_ID] = {
            message: {
                // type: MESSAGE_TYPES.ACTION,
                description: await this.getDescriptionHTML(),
                targets: getTargetDescriptors(),
                item: this.id,
            },
        };

        // Create chat message
        const message = new ChatMessage(messageConfig);

        if (options.rollMode) {
            message.applyRollMode(options.rollMode);
        }

        return message;
    }

    /**
     * Recharge the item, restoring specified resource(s) to their maximum value.
     * If no specific resource(s) are provided, all resources will be recharged.
     */
    public async recharge(resource?: ItemResource): Promise<void>;

    /**
     * Recharge the item, restoring specified resource(s) to their maximum value.
     * If no specific resource(s) are provided, all resources will be recharged.
     */
    public async recharge(resources?: ItemResource[]): Promise<void>;
    public async recharge(
        resourceOrResources?: ItemResource | ItemResource[],
    ): Promise<void> {
        if (!this.hasResources()) return;

        // Default to recharging all resources if no specific resource(s) were provided
        resourceOrResources =
            resourceOrResources ??
            (Object.keys(this.system.resources) as ItemResource[]);

        const resourcesToRecharge = (
            Array.isArray(resourceOrResources)
                ? resourceOrResources
                : [resourceOrResources]
        ).filter((resource) => this.system.resources[resource]);

        // Recharge resource
        await this.update({
            system: {
                resources: Object.fromEntries(
                    resourcesToRecharge.map((resource) => [
                        resource,
                        {
                            value: this.system.resources[resource].max,
                        },
                    ]),
                ),
            },
        });
    }

    public getTrait(
        traitId: WeaponTraitId | ArmorTraitId,
    ): TraitsItem['system']['traits'][string] | null {
        if (!this.hasTraits()) return null;
        if (!(traitId in this.system.traits)) return null;
        return this.system.traits[traitId];
    }

    public isTraitActive(traitId: WeaponTraitId | ArmorTraitId): boolean {
        const trait = this.getTrait(traitId);
        if (!trait) return false;
        return trait.active;
    }

    public getResource(
        resourceId: ItemResource,
    ): ResourcesItem['system']['resources'][ItemResource] | null {
        if (!this.hasResources()) return null;
        return this.system.resources[resourceId] ?? null;
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

    public async setEventsToggleState(
        this: CosmereItem,
        options?: EventToggleOptions,
    ) {
        if (!this.hasEvents()) return;
        const events = this.system.events;
        const forceDisable = options?.disable;
        for (const event of events) {
            if (options?.filter && !options.filter(event as Rule)) continue;

            if (forceDisable && !event.disabled) event.disabled = true;
            else event.disabled = !event.disabled;
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
        if (this.isAction() && this.system.activation!.cost.value) {
            switch (this.system.activation!.cost.type) {
                case ActionCostType.Action:
                    action = `action${Math.min(3, this.system.activation!.cost.value)}`;
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

    public override getRollData(): CosmereRollData {
        const data = {
            ...this.actor?.getRollData(),
            source: this,
            description: this.hasDescription()
                ? this.getDescriptionHTML()
                : undefined,
        } as CosmereRollData;

        return data;
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
                charges: this.hasResources()
                    ? {
                          value:
                              (this as unknown as ResourcesItem).system
                                  .resources.charges?.value ?? 0,
                          max:
                              (this as unknown as ResourcesItem).system
                                  .resources.charges?.max ?? 0,
                      }
                    : undefined,
            },
            target: targets.length > 0 ? targets[0] : undefined,
        } as const satisfies EnricherData;
    }

    public getWeaponStrikeData(this: WeaponItem) {
        if (!this.isWeapon()) throw new Error();

        const loadedTrait = this.getTrait(WeaponTraitId.Loaded);
        const hasLoadedTrait = !!loadedTrait && loadedTrait.active;

        const ammoResource = this.getResource(ItemResource.Ammo);
        const hasAmmoResource = !!ammoResource && ammoResource.max > 0;

        const actions: Item.CreateData[] = [
            {
                type: ItemType.Action,
                name: `${game.i18n.localize('COSMERE.Item.Weapon.Strike')}: ${this.name}`,
                img: this.img,
                system: {
                    id: `strike-${this.system.id}`,
                    activation: {
                        cost: {
                            value: 1,
                            type: ActionCostType.Action,
                        },
                        type: ActivationType.SkillTest,
                        consumption:
                            hasLoadedTrait && hasAmmoResource
                                ? [
                                      {
                                          type: ItemConsumeType.ItemResource,
                                          resource: ItemResource.Ammo,
                                          matchDocument: {
                                              steps: [
                                                  {
                                                      target: DocumentTarget.Parent,
                                                  },
                                              ],
                                          },
                                          value: {
                                              min: 1,
                                              max: 1,
                                          },
                                      },
                                  ]
                                : undefined,
                    },
                    skillTest: {
                        attribute: 'default',
                        skill: this.system.strike.skill,
                    },
                    damage: {
                        formula: this.strikeDieToFormula(),
                        type: this.strikeDamageType(),
                        skill: null,
                        attribute: null,
                    },
                    description: this.system.description,
                },
                flags: {
                    [SYSTEM_ID]: {
                        isStrike: true,
                    },
                },
            },
        ];

        if (hasLoadedTrait && hasAmmoResource) {
            const eventId = foundry.utils.randomID();

            actions.push({
                type: ItemType.Action,
                name: `${game.i18n.localize('COSMERE.Item.Weapon.Reload')}: ${this.name}`,
                img: this.img,
                system: {
                    id: `reload-${this.system.id}`,
                    activation: {
                        cost: {
                            value: 1,
                            type: ActionCostType.Action,
                        },
                        type: ActivationType.Utility,
                    },
                    events: {
                        [eventId]: {
                            id: eventId,
                            description: 'Reload',
                            event: 'use',
                            handler: {
                                type: 'execute-macro',
                                inline: true,
                                macro: {
                                    type: 'script',
                                    command: `event.item.parent.update({
                                        "system.resources.ammo.value": event.item.parent.system.resources.ammo.max
                                    })`,
                                },
                            },
                        },
                    },
                    description: this.system.description,
                },
            });
        }

        return actions;
    }

    public weaponTypeToSkill(this: WeaponItem, weaponType?: WeaponType): Skill {
        weaponType ??= this.system.type;
        return weaponType === WeaponType.Heavy
            ? Skill.HeavyWeapons
            : Skill.LightWeapons;
    }

    public strikeDieToFormula(this: CosmereItem): string {
        if (!this.hasStrike()) {
            return '';
        }
        const strike = this.system.strike;
        return `${strike.die.count}${strike.die.size}`;
    }

    public strikeDamageType(this: CosmereItem): DamageType {
        if (!this.hasStrike()) {
            return DamageType.Keen;
        }
        const strike = this.system.strike;
        return strike.damageType;
    }
}

export namespace CosmereItem {
    export type ToChatMessageOptions = Pick<
        CosmereRollOptions,
        'speaker' | 'actor' | 'rollMode'
    >;
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
export type EffectsContainerItem = CosmereItem<EffectsContainerItemDataModel>;
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

export type StrikingItem = CosmereItemFromSchema<StrikingItemDataSchema>;
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

export type ResourcesItem = CosmereItemFromSchema<ResourcesItemMixin.Schema>;

declare module '@league-of-foundry-developers/foundry-vtt-types/configuration' {
    interface DocumentClassConfig {
        Item: typeof CosmereItem;
    }

    interface ConfiguredItem<SubType extends Item.SubType> {
        document: CosmereItem;
    }

    // interface ConfiguredMetadata {
    //     Item: Item.Metadata & {
    //         'test': string;
    //     }
    // }

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
                isStrike?: boolean;
            };
        };
    }
}
