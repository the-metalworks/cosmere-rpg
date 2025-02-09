import {
    Skill,
    Attribute,
    ActorType,
    Condition,
    ItemType,
    ExpertiseType,
    DamageType,
    Resource,
    InjuryType,
} from '@system/types/cosmere';
import { Talent } from '@system/types/item';
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

// Dialogs
import { ShortRestDialog } from '@system/applications/actor/dialogs/short-rest';
import { MESSAGE_TYPES } from './chat-message';
import { getTargetDescriptors } from '../utils/generic';
import { AttributeScale } from '../types/config';

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
> extends Actor<T, CosmereItem> {
    // Redeclare `actor.type` to specifically be of `ActorType`.
    // This way we avoid casting everytime we want to check/use its type
    declare type: ActorType;

    /* --- Accessors --- */

    public get conditions(): Set<Condition> {
        return this.statuses as Set<Condition>;
    }

    public get applicableEffects(): ActiveEffect[] {
        const effects = new Array<ActiveEffect>();
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
        return Derived.getValue(this.system.deflect) ?? 0;
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
            const max = Derived.getValue(attr.max)!;
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
        const injuriesModifier =
            (Derived.getValue(this.system.injuries) ?? 0) * -5;

        // Build formula
        const formula = ['1d20', this.deflect, bonus, injuriesModifier].join(
            ' + ',
        );

        // Roll
        const roll = new foundry.dice.Roll(formula);

        // NOTE: Draw function type definition is wrong, must use `any` type as a workaround
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const draw = await table.draw({
            roll,
            displayChat: false,
        } as any);
        /* eslint-Enable @typescript-eslint/no-explicit-any */

        // Get result
        const result = draw.results[0] as TableResult;

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
            await durationRoll.evaluate();
            rolls.push(durationRoll);
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
     * This function will automatically apply deflect and
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

        let damageDeflect = 0;
        let damageIgnore = 0;
        let healing = 0;

        instances.forEach((instance) => {
            // Get damage config
            const damageConfig = instance.type
                ? CONFIG.COSMERE.damageTypes[instance.type]
                : { ignoreDeflect: false };

            const amount = Math.floor(instance.amount);

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

        const damageTotal =
            damageIgnore + Math.max(0, damageDeflect - this.deflect) - healing;

        // Apply damage
        const newHealth = Math.max(0, health - damageTotal);
        await this.update({
            'system.resources.hea.value': newHealth,
        });

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
                    damageTotal,
                    damageDeflect,
                    damageIgnore,
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
        data.mod = Derived.getValue(skill.mod)!;
        data.skill = {
            id: skillId,
            rank: skill.rank,
            mod: data.mod,
            attribute: skill.attribute,
        };
        data.attribute = attribute.value + attribute.bonus;
        data.attributes = this.system.attributes;

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

            if (!result.performRest) return;
            else {
                options.tendedBy = result.tendedBy;
            }
        }

        // Get Medicine mod, if required
        const mod = options.tendedBy
            ? Derived.getValue(options.tendedBy.system.skills.med.mod)
            : undefined;

        // Construct formula
        const formula = [Derived.getValue(this.system.recovery.die), mod]
            .filter((v) => !!v)
            .join(' + ');

        // Evaluate the roll
        const roll = Roll.create(formula);
        await roll.evaluate();

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
                    modal: true,
                }).render(true);
            });

            if (!shouldContinue) return;
        }

        // Update the actor
        await this.update({
            'system.resources.hea.value': Derived.getValue(
                this.system.resources.hea.max,
            ),
            'system.resources.foc.value': Derived.getValue(
                this.system.resources.foc.max,
            ),
        });
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
                        mod:
                            Derived.getValue(this.system.skills[skillId].mod) ??
                            0,
                    },
                }),
                {} as Record<Skill, { rank: number; mod: number }>,
            ),

            scalar: {
                damage: {
                    unarmed: this.getFormulaFromScalarAttribute(
                        Attribute.Strength,
                        CONFIG.COSMERE.unarmedDamageScaling.strengthRanges,
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
    public getFormulaFromScalarAttribute(
        attr: Attribute,
        scale: AttributeScale[],
    ) {
        const value = Derived.getValue(this.system.attributes[attr]) ?? 0;
        for (const range of scale) {
            if (value >= range.min && value <= range.max) {
                return range.formula;
            }
        }
        return 1;
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

    public hasTalentPrerequisites(talent: TalentItem): boolean {
        return talent.system.prerequisitesArray.every((prereq) => {
            switch (prereq.type) {
                case Talent.Prerequisite.Type.Talent:
                    return prereq.mode === Talent.Prerequisite.Mode.AllOf
                        ? prereq.talents.every((ref) => this.hasTalent(ref.id))
                        : prereq.talents.some((ref) => this.hasTalent(ref.id));
                case Talent.Prerequisite.Type.Attribute:
                    return (
                        this.getAttributeMod(prereq.attribute) >= prereq.value
                    );
                case Talent.Prerequisite.Type.Skill:
                    return this.getSkillMod(prereq.skill) >= prereq.rank;
                case Talent.Prerequisite.Type.Level: // TEMP: Until leveling is implemented
                default:
                    return true;
            }
        });
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
