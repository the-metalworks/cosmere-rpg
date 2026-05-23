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
} from '@system/types/cosmere';
import { AnyObject, EmptyObject } from '@system/types/utils';

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
import { getTargetDescriptors } from '@system/utils/generic';
import { EnricherData } from '../utils/enrichers';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { getEmbedHelpers } from '@system/utils/embed';
import ItemRelationshipUtils, {
    RemoveRelationshipOptions,
} from '@src/system/utils/item/relationship';

// Dialogs
import {
    ItemConsumeDialog,
    ItemConsumeDialogOptions,
} from '@system/applications/item/dialogs/item-consume';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { ItemOrigin } from '../types/item';
import { EmbeddedDocumentsConfig } from './embed-config/types';
import { ResourcesItemMixin } from '../data/item/mixins/resources';

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
            },
            { inplace: false },
        ),
    );

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

    /**
     * Whether or not this item has resources that can be consumed.
     */
    public hasResources(): this is ResourcesItem {
        return 'resources' in this.system;
    }

    /* --- Accessors --- */
    
    public get isActivatable(): boolean {
        if (this.type !== ItemType.Action) return true;

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

    public get actions(): readonly ActionItem[] {
        return this.items.filter((item) => item.isAction());
    }

    /**
     * Whether or not this action is the default activation for its parent item.
     * Only available for action items that are embedded in other items.
     */
    public get isDefaultActivation(): boolean {
        if (
            !this.isAction() ||
            !this.parent ||
            !(this.parent instanceof CosmereItem)
        )
            return false;
        return this.parent.actions.at(0)?.id === this.id;
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
     * Utility for using activatable items.
     * This function handles resource validation/consumption and dice rolling.
     */
    public async use(options: CosmereRollOptions = {}): Promise<CosmereRoll[]> {
        if (!this.hasActivation()) return [];

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
        const shouldConsume =
            !!this.system.activation.consume &&
            this.system.activation.consume.length > 0;

        // Determine if we should handle resource consumption
        let consumeResponse: ItemConsumeData[] | null = null;
        if (shouldConsume) {
            consumeResponse = await this.showConsumeDialog();

            // If the dialog was closed, exit out of use action
            if (consumeResponse === null) return [];
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
                    return [];
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
                return [];
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
            !!actor
        ) {
            // Add post roll action to activate the mode
            postRoll.push(() => {
                void actor.setMode(this.system.modality!, this.system.id);
            });
        }

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

        if (
            this.system.activation.type === ActivationType.SkillTest &&
            this.system.activation.resolvedSkill !== null
        ) {
            const skillOptions = foundry.utils.mergeObject(options, {
                attribute:
                    this.system.activation.resolvedAttribute ?? undefined,
                // We don't want the item setting for raise stakes to override previous choices (e.g. the fast forward raise stakes hotkey)
                raiseStakes:
                    ((options as CosmereSkillRollOptions).raiseStakes ??
                        false) ||
                    (this.system.activation.plotDie ?? false),
            });

            rolls.push(
                ...actor.generateSkillTest(
                    this.system.activation.resolvedSkill,
                    skillOptions,
                    this,
                ),
            );
        }

        if (this.hasDamage() && this.system.damage.formula) {
            const data = this.getRollData() as CosmereDamageRollData;

            data.skill =
                (options as CosmereDamageRollOptions).skill ??
                this.system.damage.skill! ??
                this.system.activation.resolvedSkill;
            const skill = actor.system.skills[data.skill];

            data.attribute =
                (options as CosmereDamageRollOptions).attribute ??
                this.system.damage.attribute! ??
                this.system.activation.resolvedAttribute;
            const attribute = actor.system.attributes[data.attribute];

            data.mod = data.attribute
                ? attribute.value +
                  attribute.bonus +
                  skill.rank +
                  skill.mod.bonus
                : skill.mod.value;

            data.parts = [this.system.damage.formula, '@mod'];
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

    protected async showConsumeDialog(
        options: ShowConsumeDialogOptions = {},
    ): Promise<ActionItemDataModel.ConsumeData[] | null> {
        if (!this.isAction()) return null;
        if (!this.system.activation!.consumption) return null;

        const consumeOptions = this.system.activation!.consumption.map(
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

        const resourcesToRecharge = Array.isArray(resourceOrResources)
            ? resourceOrResources
            : [resourceOrResources];

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
            };
        };
    }
}
