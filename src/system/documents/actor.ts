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
import {
    CosmereItem,
    CosmereItemData,
    TalentItem,
} from '@system/documents/item';
import {
    CommonActorData,
    CommonActorDataModel,
} from '@system/data/actor/common';
import { CharacterActorDataModel } from '@system/data/actor/character';
import { AdversaryActorDataModel } from '@system/data/actor/adversary';
import { Derived } from '@system/data/fields';

import { d20Roll, D20Roll, D20RollData, DamageRoll } from '@system/dice';

// Dialogs
import { ShortRestDialog } from '@system/applications/actor/dialogs/short-rest';

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
            .filter((i) => i.getFlag('cosmere-rpg', 'favorites.isFavorite'))
            .sort(
                (a, b) =>
                    a.getFlag<number>('cosmere-rpg', 'favorites.sort') -
                    b.getFlag<number>('cosmere-rpg', 'favorites.sort'),
            );
    }

    public get deflect(): number {
        return Derived.getValue(this.system.deflect) ?? 0;
    }

    /* --- Type Guards --- */

    public isCharacter(): this is CharacterActor {
        return this.type === ActorType.Character;
    }

    public isAdversary(): this is AdversaryActor {
        return this.type === ActorType.Adversary;
    }

    /* --- Lifecycle --- */

    public override async createEmbeddedDocuments(
        embeddedName: string,
        data: object[],
        opertion?: Partial<foundry.abstract.DatabaseCreateOperation>,
    ): Promise<foundry.abstract.Document[]> {
        const postCreateActions = new Array<() => void>();

        if (embeddedName === 'Item') {
            const itemData = data as CosmereItemData[];

            // Get the first ancestry item
            const ancestryItem = itemData.find(
                (d) => d.type === ItemType.Ancestry,
            );

            // Filter out any ancestry items beyond the first
            data = itemData.filter(
                (d) => d.type !== ItemType.Ancestry || d === ancestryItem,
            );

            // If an ancestry item was present, replace the current (after create)
            if (ancestryItem) {
                // Get current ancestry item
                const currentAncestryItem = this.items.find(
                    (i) => i.type === ItemType.Ancestry,
                );

                // Remove existing ancestry after create, if present
                if (currentAncestryItem) {
                    postCreateActions.push(() => {
                        void this.deleteEmbeddedDocuments('Item', [
                            currentAncestryItem.id,
                        ]);
                    });
                }
            }

            // Get the first culture item
            const cultureItem = itemData.find(
                (d) => d.type === ItemType.Culture,
            );

            // Filter out any culture items beyond the first
            data = itemData.filter(
                (d) => d.type !== ItemType.Culture || d === cultureItem,
            );

            // If a culture item was present, replace the current (after create)
            if (cultureItem) {
                // Get current culture item
                const currentCultureItem = this.items.find(
                    (i) => i.type === ItemType.Culture,
                );

                // Remove existing culture after create, if present
                if (currentCultureItem) {
                    postCreateActions.push(() => {
                        void this.deleteEmbeddedDocuments('Item', [
                            currentCultureItem.id,
                        ]);
                    });
                }
            }
        }

        // Perform create
        const result = await super.createEmbeddedDocuments(
            embeddedName,
            data,
            opertion,
        );

        // Post create actions
        postCreateActions.forEach((func) => func());

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

    /* --- Functions --- */

    public async setMode(modality: string, mode: string) {
        await this.setFlag('cosmere-rpg', `mode.${modality}`, mode);

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
        await this.unsetFlag('cosmere-rpg', `mode.${modality}`);

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

    public async rollInjuryDuration() {
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
        const results = (
            await table.draw({
                roll,
            } as any)
        ).results as TableResult[];
        /* eslint-Enable @typescript-eslint/no-explicit-any */

        // Get result
        const result = results[0];

        // Get injury data
        const data: { type: InjuryType; durationFormula: string } =
            result.getFlag('cosmere-rpg', 'injury-data');

        if (
            data.type !== InjuryType.Death &&
            data.type !== InjuryType.PermanentInjury
        ) {
            // Roll duration
            const durationRoll = new foundry.dice.Roll(data.durationFormula);
            await durationRoll.evaluate();

            // Get speaker
            const speaker = ChatMessage.getSpeaker({
                actor: this,
            }) as ChatSpeakerData;

            // Chat message
            await ChatMessage.create({
                user: game.user!.id,
                speaker,
                content: `<p>${game.i18n!.localize(
                    'COSMERE.ChatMessage.InjuryDuration',
                )} (${game.i18n!.localize('GENERIC.Units.Days')})</p>`,
                rolls: [durationRoll],
            });
        }
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
        const health = this.system.resources[Resource.Health];

        let damage = 0;
        let deflected = 0;
        instances.forEach((instance) => {
            // Get damage config
            const damageConfig = instance.type
                ? CONFIG.COSMERE.damageTypes[instance.type]
                : { ignoreDeflect: false };

            let amount = instance.amount;
            if (!damageConfig.ignoreDeflect) {
                // Apply deflect
                amount = Math.max(0, amount - this.deflect);
                deflected += this.deflect;
            }

            if (instance.type === DamageType.Healing) {
                amount = -amount;
            }

            // Add to running total
            damage += amount;
        });

        // Get total damage
        const totalDamage = damage + deflected;

        // Whether or not the damage is actually healing
        const isHealing = totalDamage < 0;

        // Apply damage
        const newHealth = Math.max(0, health.value - damage);

        // Update health
        await this.update({
            'system.resources.hea.value': newHealth,
        });

        if (chatMessage) {
            // Chat message
            let flavor = game
                .i18n!.localize(
                    isHealing
                        ? 'COSMERE.ChatMessage.ApplyHealing'
                        : 'COSMERE.ChatMessage.ApplyDamage',
                )
                .replace('[actor]', this.name)
                .replace('[amount]', Math.abs(damage).toString());

            if (!isHealing && deflected > 0) {
                flavor += ` (${totalDamage} - <i class="deflect fa-solid fa-shield"></i>${deflected})`;
            }

            // Chat message
            await ChatMessage.create({
                user: game.user!.id,
                speaker: ChatMessage.getSpeaker({
                    actor: this,
                }) as ChatSpeakerData,
                content: `<span class="damage-notification">
                    ${flavor}.
                    <a class="action" 
                        data-action="undo-damage" 
                        data-amount="${damage}"
                        data-tooltip="${
                            isHealing
                                ? 'COSMERE.ChatMessage.UndoHealing'
                                : 'COSMERE.ChatMessage.UndoDamage'
                        }"
                    >
                        <i class="fa-solid fa-rotate-left"></i>
                    </a>
                </span>`,
            });
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
        const rank = this.system.skills[skill].rank;

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
                title: `${flavor}: ${this.name}`,
                chatMessage: false,
                defaultAttribute: options.attribute ?? skill.attribute,
            },
            options,
        );
        rollData.parts = [`@mod`].concat(options.parts ?? []);

        // Perform roll
        const roll = await d20Roll(rollData);

        if (roll) {
            // Get the speaker
            const speaker =
                options.speaker ??
                (ChatMessage.getSpeaker({ actor: this }) as ChatSpeakerData);

            // Create chat message
            await ChatMessage.create({
                user: game.user!.id,
                speaker,
                content: `<p>${flavor}</p>`,
                rolls: [roll],
            });
        }

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
     * Utility function to increment/decrement a skill value
     */
    public async modifySkillRank(
        skillId: Skill,
        incrementBool = true,
        render = true,
    ) {
        const skillpath = `system.skills.${skillId}.rank`;
        const skill = this.system.skills[skillId];
        if (incrementBool) {
            await this.update(
                { [skillpath]: Math.clamp(skill.rank + 1, 0, 5) },
                { render },
            );
        } else {
            await this.update(
                { [skillpath]: Math.clamp(skill.rank - 1, 0, 5) },
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
    ): Promise<D20Roll | [D20Roll, DamageRoll] | null> {
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
                        'COSMERE.Actor.Sheet.ShouldPerformLongRest',
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
     * Utility function to determine if an actor has a given expertise
     */
    public hasExpertise(type: ExpertiseType, id: string): boolean {
        return (
            this.system.expertises?.some(
                (expertise) => expertise.type === type && expertise.id === id,
            ) ?? false
        );
    }
}
