import {
    Skill,
    Attribute,
    ActorType,
    Status,
    ItemType,
    ExpertiseType,
    DamageType,
    Resource,
    InjuryType,
    Size,
    RestType,
} from '@system/types/cosmere';
import { Talent, TalentTree } from '@system/types/item';
import {
    CosmereItem,
    CosmereItemData,
    AncestryItem,
    CultureItem,
    PathItem,
    TalentItem,
    GoalItem,
    PowerItem,
} from '@system/documents/item';
import { CosmereActiveEffect } from '@system/documents/active-effect';

import {
    CommonActorData,
    CommonActorDataModel,
} from '@system/data/actor/common';
import { CharacterActorDataModel } from '@system/data/actor/character';
import { AdversaryActorDataModel } from '@system/data/actor/adversary';

import { PowerItemData } from '@system/data/item';

import { Derived } from '@system/data/fields';
import { SYSTEM_ID } from '../constants';
import { d20Roll, D20Roll, D20RollData, DamageRoll } from '@system/dice';
import { AttributeScale } from '../types/config';

// Dialogs
import { ShortRestDialog } from '@system/applications/actor/dialogs/short-rest';
import { MESSAGE_TYPES } from './chat-message';

// Utils
import { getTargetDescriptors } from '../utils/generic';
import { characterMeetsTalentPrerequisites } from '@system/utils/talent-tree';
import { CosmereHooks } from '../types/hooks';

export type CharacterActor = CosmereActor<CharacterActorDataModel>;
export type AdversaryActor = CosmereActor<AdversaryActorDataModel>;

interface RollSkillOptions {
    /**
     * The attribute to be used with this skill roll.
     * Used to roll a skill with an alternate attribute.
     *
     * @default - The attribute associated with this skill
     */
    attribute?: Attribute;

    /**
     * The dice roll component parts, excluding the initial d20
     * @default []
     */
    parts?: string[];

    /**
     * Who is sending the chat message for this roll?
     *
     * @default - ChatMessage.getSpeaker({ actor })`
     */
    speaker?: ChatSpeakerData;
}

interface LongRestOptions {
    /**
     * Whether or not to display the rest dialog.
     * @default true
     */
    dialog?: boolean;
}

interface ShortRestOptions extends LongRestOptions {
    /**
     * The character whose Medicine modifier to add
     * to the recovery die roll.
     */
    tendedBy?: CharacterActor;
}

interface DamageInstance {
    amount: number;
    type?: DamageType;
}

interface ApplyDamageOptions {
    /**
     * Whether or not to display a chat message
     * @default true
     */
    chatMessage?: boolean;
}

export type CosmereActorRollData<T extends CommonActorData = CommonActorData> =
    {
        [K in keyof T]: T[K];
    } & {
        attr: Record<string, number>;
        skills: Record<string, { rank: number; mod: number }>;

        scalar: {
            damage: {
                unarmed: string;
            };

            power: Record<
                string,
                {
                    die: string;
                    'effect-size': Size;
                }
            >;
        };
    };

// Constants
/**
 * Item types of which only a single instance can be
 * embedded in an actor.
 */
const SINGLETON_ITEM_TYPES = [ItemType.Ancestry];

export class CosmereActor<
    T extends CommonActorDataModel = CommonActorDataModel,
    SystemType extends CommonActorData = T extends CommonActorDataModel<infer S>
        ? S
        : never,
> extends Actor<T, CosmereItem, CosmereActiveEffect> {
    // Redeclare `actor.type` to specifically be of `ActorType`.
    // This way we avoid casting everytime we want to check/use its type
    declare type: ActorType;

    /* --- Accessors --- */

    public get conditions(): Set<Status> {
        return this.statuses as Set<Status>;
    }

    public get applicableEffects(): CosmereActiveEffect[] {
        const effects = new Array<CosmereActiveEffect>();
        for (const effect of this.allApplicableEffects()) {
            effects.push(effect);
        }
        return effects;
    }

    public get favorites(): CosmereItem[] {
        return this.items
            .filter((i) => i.getFlag(SYSTEM_ID, 'favorites.isFavorite'))
            .sort(
                (a, b) =>
                    a.getFlag<number>(SYSTEM_ID, 'favorites.sort') -
                    b.getFlag<number>(SYSTEM_ID, 'favorites.sort'),
            );
    }

    public get deflect(): number {
        return this.system.deflect.value;
    }

    public get ancestry(): AncestryItem | undefined {
        return this.items.find((i) => i.isAncestry()) as
            | AncestryItem
            | undefined;
    }

    public get cultures(): CultureItem[] {
        return this.items.filter((i) => i.isCulture());
    }

    public get paths(): PathItem[] {
        return this.items.filter((i) => i.isPath());
    }

    public get goals(): GoalItem[] {
        return this.items.filter((i) => i.isGoal());
    }

    public get powers(): PowerItem[] {
        return this.items.filter((i) => i.isPower());
    }

    public get talents(): TalentItem[] {
        return this.items.filter((i) => i.isTalent());
    }

    /* --- Type Guards --- */

    public isCharacter(): this is CharacterActor {
        return this.type === ActorType.Character;
    }

    public isAdversary(): this is AdversaryActor {
        return this.type === ActorType.Adversary;
    }

    /* --- Lifecycle --- */

    protected override _initialize(options?: object) {
        super._initialize(options);

        // Migrate goals
        void this.migrateGoals();
    }

    public override async _preCreate(
        data: object,
        options: object,
        user: foundry.documents.BaseUser,
    ): Promise<boolean | void> {
        if ((await super._preCreate(data, options, user)) === false)
            return false;

        // Configure prototype token settings
        const prototypeToken = {};

        if (this.isCharacter()) {
            foundry.utils.mergeObject(prototypeToken, {
                sight: {
                    enabled: true,
                },
                actorLink: true,
                disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            });
        }

        this.updateSource({ prototypeToken });
    }

    public override async createEmbeddedDocuments(
        embeddedName: string,
        data: object[],
        opertion?: Partial<foundry.abstract.DatabaseCreateOperation>,
    ): Promise<foundry.abstract.Document[]> {
        // Pre create actions
        if (
            this.preCreateEmbeddedDocuments(embeddedName, data, opertion) ===
            false
        )
            return [];

        // Perform create
        const result = await super.createEmbeddedDocuments(
            embeddedName,
            data,
            opertion,
        );

        // Post create actions
        this.postCreateEmbeddedDocuments(embeddedName, result);

        // Return result
        return result;
    }

    public override async modifyTokenAttribute(
        attribute: string,
        value: number,
        isDelta: boolean,
        isBar: boolean,
    ) {
        if (isBar) {
            // Get the attribute object
            const attr = foundry.utils.getProperty(this.system, attribute) as {
                value: number;
                max: Derived<number>;
            };
            const current = attr.value;
            const max = attr.max.value;
            const update = Math.clamp(
                isDelta ? current + value : value,
                0,
                max,
            );
            if (update === current) return this;

            // Set up updates
            const updates = {
                [`system.${attribute}.value`]: update,
            };

            // Allow a hook to override these changes
            const allowed = Hooks.call(
                'modifyTokenAttribute',
                { attribute, value, isDelta, isBar },
                updates,
            );
            return allowed !== false
                ? ((await this.update(updates)) as this)
                : this;
        } else {
            await super.modifyTokenAttribute(attribute, value, isDelta, isBar);
        }
    }

    public override toggleStatusEffect(
        statusId: string,
        options?: Actor.ToggleStatusEffectOptions,
    ): Promise<ActiveEffect | boolean | undefined> {
        // Check if actor is immune to status effect
        if (
            statusId in this.system.immunities.condition &&
            this.system.immunities.condition[statusId as Status]
        ) {
            // Notify
            ui.notifications.warn(
                game.i18n!.format('GENERIC.Warning.ActorConditionImmune', {
                    actor: this.name,
                    condition: game.i18n!.localize(
                        CONFIG.COSMERE.statuses[statusId as Status].label,
                    ),
                }),
            );

            return Promise.resolve(false);
        }

        // Handle as normal
        return super.toggleStatusEffect(statusId, options);
    }

    /* --- Handlers --- */

    protected preCreateEmbeddedDocuments(
        embeddedName: string,
        data: object[],
        opertion?: Partial<foundry.abstract.DatabaseCreateOperation>,
    ): boolean | void {
        if (embeddedName === 'Item') {
            const itemData = data as CosmereItemData[];

            // Check for singleton items
            SINGLETON_ITEM_TYPES.forEach((type) => {
                // Get the first item of this type
                const item = itemData.find((d) => d.type === type);

                // Filter out any other items of this type
                data = item
                    ? itemData.filter((d) => d.type !== type || d === item)
                    : itemData;
            });

            // Pre add powers
            itemData.forEach((d, i) => {
                if (d.type === ItemType.Power) {
                    if (
                        this.preAddPower(
                            d as CosmereItemData<PowerItemData>,
                        ) === false
                    ) {
                        itemData.splice(i, 1);
                    }
                }
            });
        }
    }

    protected preAddPower(
        data: CosmereItemData<PowerItemData>,
    ): boolean | void {
        // Ensure a power with the same id does not already exist
        if (
            this.powers.some(
                (i) => i.hasId() && i.system.id === data.system?.id,
            )
        ) {
            ui.notifications.error(
                game.i18n!.format(
                    'COSMERE.Item.Power.Notification.PowerExists',
                    {
                        actor: this.name,
                        identifier: data.system!.id,
                    },
                ),
            );
            return false;
        }
    }

    protected postCreateEmbeddedDocuments(
        embeddedName: string,
        documents: foundry.abstract.Document[],
    ): void {
        documents.forEach((doc) => {
            if (embeddedName === 'Item') {
                const item = doc as CosmereItem;

                if (item.isAncestry()) {
                    this.onAncestryAdded(item);
                } else if (item.isTalent()) {
                    this.onTalentAdded(item);
                }
            }
        });
    }

    protected onAncestryAdded(item: AncestryItem) {
        // Find any other ancestry items
        const otherAncestries = this.items.filter(
            (i) => i.isAncestry() && i.id !== item.id,
        );

        // Remove other ancestries
        otherAncestries.forEach((i) => {
            void i.delete();
        });
    }

    protected onTalentAdded(item: TalentItem) {
        // Check if the talent has grant rules
        if (item.system.grantRules.size > 0) {
            // Execute grant rules
            item.system.grantRules.forEach((rule) => {
                if (rule.type === Talent.GrantRule.Type.Items) {
                    rule.items.forEach(async (itemUUID) => {
                        // Get document
                        const doc = (await fromUuid(
                            itemUUID,
                        )) as unknown as CosmereItem;

                        // Get id
                        const id = doc.hasId() ? doc.system.id : null;

                        // Ensure the item is not already present
                        if (
                            !id ||
                            this.items.some(
                                (i) => i.hasId() && i.system.id === id,
                            )
                        )
                            return;

                        // Add the item to the actor
                        await this.createEmbeddedDocuments('Item', [
                            doc.toObject(),
                        ]);

                        // Notification
                        ui.notifications.info(
                            game.i18n!.format(
                                'GENERIC.Notification.AddedItem',
                                {
                                    type: game.i18n!.localize(
                                        `TYPES.Item.${doc.type}`,
                                    ),
                                    item: doc.name,
                                    actor: this.name,
                                },
                            ),
                        );
                    });
                }
            });
        }
    }

    /* --- Functions --- */

    public async setMode(modality: string, mode: string) {
        await this.setFlag(SYSTEM_ID, `mode.${modality}`, mode);

        // Get all effects for this modality
        const effects = this.applicableEffects.filter(
            (effect) =>
                effect.parent instanceof CosmereItem &&
                effect.parent.hasModality() &&
                effect.parent.system.modality === modality,
        );

        // Get the effect for the new mode
        const modeEffect = effects.find(
            (effect) => (effect.parent as TalentItem).system.id === mode,
        );

        // Deactivate all other effects
        for (const effect of effects) {
            if (effect !== modeEffect && !effect.disabled) {
                void effect.update({ disabled: true });
            }
        }

        // Activate the mode effect
        if (modeEffect) {
            void modeEffect.update({ disabled: false });
        }
    }

    public async clearMode(modality: string) {
        await this.unsetFlag(SYSTEM_ID, `mode.${modality}`);

        // Get all effects for this modality
        const effects = this.effects.filter(
            (effect) =>
                effect.parent instanceof CosmereItem &&
                effect.parent.isTalent() &&
                effect.parent.system.id === modality,
        );

        // Deactivate all effects
        for (const effect of effects) {
            void effect.update({ disabled: true });
        }
    }

    public async rollInjury() {
        // Get roll table
        const table = (await fromUuid(
            CONFIG.COSMERE.injury.durationTable,
        )) as unknown as RollTable;

        // Get injury roll bonus
        const bonus = this.system.injuryRollBonus;

        // Get injuries modifier
        const injuriesModifier = this.system.injuries.value * -5;

        // Build formula
        const formula = ['1d20', this.deflect, bonus, injuriesModifier].join(
            ' + ',
        );

        // Roll
        const roll = new foundry.dice.Roll(formula);

        /**
         * Hook: preRollInjuryType
         */
        if (
            Hooks.call<CosmereHooks.PreRoll>(
                'cosmere.preInjuryTypeRoll',
                roll, // Roll object
                this, // Source
            ) === false
        )
            return;

        // NOTE: Draw function type definition is wrong, must use `any` type as a workaround
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const draw = await table.draw({
            roll,
            displayChat: false,
        } as any);
        /* eslint-Enable @typescript-eslint/no-explicit-any */

        // Get result
        const result = draw.results[0] as TableResult;

        /**
         * Hook: postRollInjuryType
         */
        Hooks.callAll<CosmereHooks.PostRoll>(
            'cosmere.postInjuryTypeRoll',
            roll, // Evaluated roll
            result, // Table result
            this, // Source
        );

        // Get injury data
        const data: { type: InjuryType; durationFormula: string } =
            result.getFlag(SYSTEM_ID, 'injury-data');

        const rolls = [];
        if (
            data.type !== InjuryType.Death &&
            data.type !== InjuryType.PermanentInjury
        ) {
            // Roll duration
            const durationRoll = new foundry.dice.Roll(data.durationFormula);

            /**
             * Hook: preRollInjuryDuration
             */
            if (
                Hooks.call<CosmereHooks.PreRoll>(
                    'cosmere.preInjuryDurationRoll',
                    durationRoll, // Roll object
                    this, // Source
                ) === false
            )
                return;

            await durationRoll.evaluate();
            rolls.push(durationRoll);

            /**
             * Hook: postRollInjuryDuration
             *
             * Passes the evaluated roll
             */
            Hooks.callAll<CosmereHooks.PostRoll>(
                'cosmere.postInjuryDurationRoll',
                durationRoll, // Roll object
                this, // Source
                {}, // Options
            );
        }

        const flags = {} as Record<string, any>;
        flags[SYSTEM_ID] = {
            message: {
                type: MESSAGE_TYPES.INJURY,
            },
            injury: {
                details: result,
                roll: draw.roll,
            },
        };

        // Chat message
        await ChatMessage.create({
            user: game.user!.id,
            speaker: ChatMessage.getSpeaker({
                actor: this,
            }) as ChatSpeakerData,
            flags,
            rolls,
        });
    }

    /**
     * Utility function to apply damage to this actor.
     * This function will automatically apply deflect & immunities and
     * send a chat message.
     */
    public async applyDamage(
        ...config: DamageInstance[] | [...DamageInstance[], ApplyDamageOptions]
    ) {
        // Check if the last argument is an options object
        const hasOptions =
            config.length > 0 && !('amount' in config[config.length - 1]);

        // Get instances
        const instances = (
            hasOptions ? config.slice(0, -1) : config
        ) as DamageInstance[];
        const { chatMessage = true } = (
            hasOptions ? config[config.length - 1] : {}
        ) as ApplyDamageOptions;

        // Get health resource
        const health = this.system.resources[Resource.Health].value;

        // Get immunities
        const immunities = this.system.immunities;

        let damageDeflect = 0;
        let damageIgnore = 0;
        let damageImmune = 0;
        let healing = 0;
        const appliedImmunities = new Map<DamageType, number>();

        instances.forEach((instance) => {
            // Get damage config
            const damageConfig = instance.type
                ? CONFIG.COSMERE.damageTypes[instance.type]
                : { ignoreDeflect: false };

            const amount = Math.floor(instance.amount);

            // Check if actor is immune to damage type
            if (!!instance.type && immunities.damage[instance.type]) {
                // Add to total immune damage
                damageImmune += instance.amount;

                // Add individual immunities
                appliedImmunities.set(
                    instance.type,
                    (appliedImmunities.get(instance.type) ?? 0) +
                        instance.amount,
                );
                return;
            }

            if (instance.type === DamageType.Healing) {
                healing += amount;
                return;
            }

            if (damageConfig.ignoreDeflect) {
                damageIgnore += amount;
            } else {
                damageDeflect += amount;
            }
        });

        const damageTaken =
            damageIgnore + Math.max(0, damageDeflect - this.deflect) - healing;

        // Store in an object to pass by reference into hooks
        const damage: CosmereHooks.DamageValues = {
            // Unadjusted damage calculation
            calculated: damageTaken,
        };

        /**
         * Hook: preApplyDamage
         */
        if (
            Hooks.call<CosmereHooks.ApplyDamage>(
                'cosmere.preApplyDamage',
                this,
                damage,
            ) === false
        )
            return;

        // Apply damage
        const newHealth = Math.max(0, health - damage.calculated);
        await this.update({
            'system.resources.hea.value': newHealth,
        });
        // Actual damage that was applied
        damage.dealt = health - newHealth;

        /**
         * Hook: postApplyDamage
         */
        Hooks.callAll<CosmereHooks.ApplyDamage>(
            'cosmere.postApplyDamage',
            this,
            damage,
        );

        if (chatMessage) {
            const messageConfig = {
                user: game.user!.id,
                speaker: ChatMessage.getSpeaker({
                    actor: this,
                }) as ChatSpeakerData,
                flags: {} as Record<string, unknown>,
            };

            messageConfig.flags[SYSTEM_ID] = {
                message: {
                    type: MESSAGE_TYPES.DAMAGE_TAKEN,
                },
                taken: {
                    health,
                    damageTaken: damage.calculated,
                    damageDeflect,
                    damageIgnore,
                    damageImmune,
                    appliedImmunities: Object.fromEntries(appliedImmunities),
                    target: this.uuid,
                    undo: true,
                },
            };

            // Create chat message
            await ChatMessage.create(messageConfig);
        }
    }

    public async applyHealing(amount: number) {
        return this.applyDamage({ amount, type: DamageType.Healing });
    }

    /**
     * Utility function to get the modifier for a given attribute for this actor.
     * @param attribute The attribute to get the modifier for
     */
    public getAttributeMod(attribute: Attribute): number {
        // Get attribute
        const attr = this.system.attributes[attribute];
        return attr.value + attr.bonus;
    }

    /**
     * Utility function to get the modifier for a given skill for this actor.
     * @param skill The skill to get the modifier for
     * @param attributeOverride An optional attribute override, used instead of the default attribute
     */
    public getSkillMod(skill: Skill, attributeOverride?: Attribute): number {
        // Get attribute id
        const attributeId =
            attributeOverride ?? CONFIG.COSMERE.skills[skill].attribute;

        // Get skill rank
        const rank = this.system.skills[skill]?.rank ?? 0;

        // Get attribute value
        const attrValue = this.getAttributeMod(attributeId);

        return attrValue + rank;
    }

    /**
     * Roll a skill for this actor
     */
    public async rollSkill(
        skillId: Skill,
        options: RollSkillOptions = {},
    ): Promise<D20Roll | null> {
        const skill = this.system.skills[skillId];
        const attribute =
            this.system.attributes[options.attribute ?? skill.attribute];
        const data = this.getRollData() as Partial<D20RollData>;

        // Add attribute mod
        data.mod = skill.mod.value;
        data.skill = {
            id: skillId,
            rank: skill.rank,
            mod: data.mod,
            attribute: skill.attribute,
        };
        data.attribute = attribute.value + attribute.bonus;
        data.attributes = this.system.attributes;
        data.context = 'Skill';

        // Prepare roll data
        const flavor = `${game.i18n!.localize(
            CONFIG.COSMERE.skills[skillId].label,
        )} ${game.i18n!.localize('GENERIC.SkillTest')}`;
        const rollData = foundry.utils.mergeObject(
            {
                data: data as D20RollData,
                title: flavor,
                defaultAttribute: options.attribute ?? skill.attribute,
                messageData: {
                    speaker:
                        options.speaker ??
                        (ChatMessage.getSpeaker({
                            actor: this,
                        }) as ChatSpeakerData),
                    flags: {} as Record<string, any>,
                },
            },
            options,
        );

        rollData.parts = [`@mod`].concat(options.parts ?? []);
        rollData.messageData.flags[SYSTEM_ID] = {
            message: {
                type: MESSAGE_TYPES.SKILL,
                targets: getTargetDescriptors(),
            },
        };

        // Perform roll
        const roll = await d20Roll(rollData);

        // Return roll
        return roll;
    }

    /**
     * Utility function to roll an item for this actor
     */
    public async rollItem(
        item: CosmereItem,
        options?: Omit<CosmereItem.RollOptions, 'actor'>,
    ): Promise<D20Roll | null> {
        return item.roll({ ...options, actor: this });
    }

    /**
     * Utility function to modify a skill value
     */
    public async modifySkillRank(
        skillId: Skill,
        change: number,
        render?: boolean,
    ): Promise<void>;
    /**
     * Utility function to increment/decrement a skill value
     */
    public async modifySkillRank(
        skillId: Skill,
        increment: boolean,
        render?: boolean,
    ): Promise<void>;
    public async modifySkillRank(
        skillId: Skill,
        param1: boolean | number = true,
        render = true,
    ) {
        const incrementBool = typeof param1 === 'boolean' ? param1 : true;
        const changeAmount = typeof param1 === 'number' ? param1 : 1;

        const skillpath = `system.skills.${skillId}.rank`;
        const skill = this.system.skills[skillId];
        if (incrementBool) {
            await this.update(
                { [skillpath]: Math.clamp(skill.rank + changeAmount, 0, 5) },
                { render },
            );
        } else {
            await this.update(
                { [skillpath]: Math.clamp(skill.rank - changeAmount, 0, 5) },
                { render },
            );
        }
    }

    /**
     * Utility function to use an item for this actor
     */
    public async useItem(
        item: CosmereItem,
        options?: Omit<CosmereItem.UseOptions, 'actor'>,
    ): Promise<D20Roll | [D20Roll, ...DamageRoll[]] | null> {
        // Checks for relevant Active Effects triggers/manual toggles will go here
        // E.g. permanent/conditional: attack bonuses, damage riders, auto opportunity/complications, etc.
        return item.use({ ...options, actor: this });
    }

    /**
     * Utility function to handle short resting.
     * This function takes care of rolling the recovery die.
     * Automatically applies the appropriate Medicine modifier.
     */
    public async shortRest(options: ShortRestOptions = {}) {
        if (!this.isCharacter()) return;

        // Defaults
        options.dialog = options.dialog ?? true;

        // Show the dialog if required
        if (options.dialog) {
            const result = await ShortRestDialog.show(this, options);

            if (!result?.performRest) return;

            options.tendedBy = result.tendedBy;
        }

        /**
         * Hook: preRest
         */
        if (
            Hooks.call<CosmereHooks.Rest>(
                'cosmere.preRest',
                this,
                RestType.Short,
            ) === false
        ) {
            return;
        }

        // Get Medicine mod, if required
        const mod = options.tendedBy
            ? options.tendedBy.system.skills.med.mod.value
            : undefined;

        // Construct formula
        const formula = [this.system.recovery.die.value, mod]
            .filter((v) => !!v)
            .join(' + ');

        // Configure the roll
        const roll = Roll.create(formula);

        /**
         * Hook: preShortRestRecoveryRoll
         */
        if (
            Hooks.call<CosmereHooks.PreRoll>(
                'cosmere.preShortRestRecoveryRoll',
                roll, // Roll object
                this, // Source
            ) === false
        )
            return;

        // Evaluate the roll
        await roll.evaluate();

        /**
         * Hook: postShortRestRecoveryRoll
         */
        Hooks.callAll<CosmereHooks.PostRoll>(
            'cosmere.postShortRestRecoveryRoll',
            roll, // Roll object
            this, // Source
            {}, // Options
        );

        // Set up flavor
        let flavor = game
            .i18n!.localize('ROLLS.Recovery')
            .replace('[character]', this.name);
        if (options.tendedBy) {
            flavor += ` ${game
                .i18n!.localize('ROLLS.RecoveryTend')
                .replace('[tender]', options.tendedBy.name)}`;
        }

        // Chat message
        await roll.toMessage({
            flavor,
        });

        /**
         * Hook: postRest
         */
        Hooks.callAll<CosmereHooks.Rest>(
            'cosmere.postRest',
            this,
            RestType.Short,
        );
    }

    /**
     * Utility function to handle long resting.
     * Long resting grants the following benefits:
     * - Recover all lost health
     * - Recover all lost focus
     * - Reduce Exhausted penalty by 1 (TODO)
     */
    public async longRest(options: LongRestOptions = {}) {
        // Defaults
        options.dialog = options.dialog ?? true;

        // Show the confirm dialog if required
        if (options.dialog) {
            const shouldContinue = await new Promise((resolve) => {
                void new foundry.applications.api.DialogV2({
                    window: {
                        title: 'COSMERE.Actor.Sheet.LongRest',
                    },
                    content: `<span>${game.i18n!.localize(
                        'DIALOG.LongRest.ShouldPerform',
                    )}</span>`,
                    buttons: [
                        {
                            label: 'GENERIC.Button.Continue',
                            action: 'continue',
                            // NOTE: Callback must be async
                            // eslint-disable-next-line @typescript-eslint/require-await
                            callback: async () => resolve(true),
                        },
                        {
                            label: 'GENERIC.Button.Cancel',
                            action: 'cancel',
                            // eslint-disable-next-line @typescript-eslint/require-await
                            callback: async () => resolve(false),
                        },
                    ],
                }).render(true);
            });

            if (!shouldContinue) return;
        }

        /**
         * Hook: preRest
         */
        if (
            Hooks.call<CosmereHooks.Rest>(
                'cosmere.preRest',
                this,
                RestType.Long,
            ) === false
        )
            return;

        // Update the actor
        await this.update({
            'system.resources.hea.value': this.system.resources.hea.max.value,
            'system.resources.foc.value': this.system.resources.foc.max.value,
        });

        /**
         * Hook: postRest
         */
        Hooks.callAll<CosmereHooks.Rest>(
            'cosmere.postRest',
            this,
            RestType.Long,
        );
    }

    public getRollData(): CosmereActorRollData<SystemType> {
        return {
            ...(super.getRollData() as SystemType),

            // Attributes shorthand
            attr: (
                Object.keys(CONFIG.COSMERE.attributes) as Attribute[]
            ).reduce(
                (data, attrId) => ({
                    ...data,
                    [attrId]: this.system.attributes[attrId].value,
                }),
                {} as Record<Attribute, number>,
            ),

            // Skills
            skills: (Object.keys(CONFIG.COSMERE.skills) as Skill[]).reduce(
                (data, skillId) => ({
                    ...data,
                    [skillId]: {
                        rank: this.system.skills[skillId].rank,
                        mod: this.system.skills[skillId].mod.value,
                    },
                }),
                {} as Record<Skill, { rank: number; mod: number }>,
            ),

            // Scalars
            scalar: {
                damage: {
                    unarmed: this.getFormulaFromScalarAttribute(
                        Attribute.Strength,
                        CONFIG.COSMERE.scaling.damage.unarmed.strength,
                    ),
                },
                power: {
                    ...this.powers.reduce(
                        (scaling, power) => {
                            // Get the power skill id
                            const skillId = power.system.skill;
                            if (!skillId) return scaling;

                            // Get the skill
                            const skill = this.system.skills[skillId];
                            if (!skill?.unlocked) return scaling;

                            // Add scaling
                            scaling[power.system.id] = {
                                die: this.getFormulaFromScalar(
                                    skill.rank,
                                    CONFIG.COSMERE.scaling.power.die.ranks,
                                ),
                                'effect-size': this.getFormulaFromScalar(
                                    skill.rank,
                                    CONFIG.COSMERE.scaling.power.effectSize
                                        .ranks,
                                ),
                            };

                            return scaling;
                        },
                        {} as Record<
                            string,
                            { die: string; 'effect-size': Size }
                        >,
                    ),
                },
            },
        };
    }

    public *allApplicableEffects() {
        for (const effect of super.allApplicableEffects()) {
            if (
                !(effect.parent instanceof CosmereItem) ||
                !effect.parent.isEquippable() ||
                effect.parent.system.equipped
            ) {
                yield effect;
            }
        }
    }

    /**
     * Utility Function to determine a formula value based on a scalar plot of an attribute value
     */
    public getFormulaFromScalarAttribute<T extends string = string>(
        attrId: Attribute,
        scale: AttributeScale<T>[],
    ) {
        // Get the attribute
        const attr = this.system.attributes[attrId];
        const value = attr.value + attr.bonus;
        return this.getFormulaFromScalar<T>(value, scale);
    }

    public getFormulaFromScalar<T extends string = string>(
        value: number,
        scale: AttributeScale<T>[],
    ) {
        for (const range of scale) {
            if (
                ('value' in range && value === range.value) ||
                ('min' in range && value >= range.min && value <= range.max)
            ) {
                return range.formula;
            }
        }

        // Default to the first (assumed lowest) formula
        return scale[0].formula;
    }

    /**
     * Utility function to determine if an actor has a given expertise
     */
    public hasExpertise(type: ExpertiseType, id: string): boolean {
        return (
            this.system.expertises?.some(
                (expertise) => expertise.type === type && expertise.id === id,
            ) ?? false
        );
    }

    /**
     * Utility function to determine if an actor has a given talent
     */
    public hasTalent(id: string): boolean {
        return this.talents.some((talent) => talent.system.id === id);
    }

    /**
     * Utility function to determine if the actor meets the
     * given talent prerequisites.
     */
    public hasTalentPreRequisites(
        prerequisites: Collection<TalentTree.Node.Prerequisite>,
    ): boolean {
        if (!this.isCharacter()) return false;
        return characterMeetsTalentPrerequisites(this, prerequisites);
    }

    /* --- Helpers --- */

    /**
     * Migrate goals from the system object to individual items.
     *
     */
    private async migrateGoals() {
        if (!this.isCharacter() || !this.system.goals) return;

        const goals = this.system.goals;

        // Remove goals from data
        await this.update({
            'system.goals': null,
        });

        // Create goal items
        goals.forEach((goalData) => {
            void Item.create(
                {
                    type: ItemType.Goal,
                    name: goalData.text,
                    system: {
                        level: goalData.level,
                    },
                },
                { parent: this },
            );
        });
    }
}
