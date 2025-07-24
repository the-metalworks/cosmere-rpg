import {
    DamageType,
    InjuryType,
    ItemType,
    Resource,
} from '@system/types/cosmere';
import { D20Roll } from '@system/dice/d20-roll';
import { DamageRoll } from '@system/dice/damage-roll';

import { CosmereActor } from './actor';
import { CosmereItem, InjuryItem } from './item';

import { AdvantageMode } from '@system/types/roll';
import { CosmereHooks } from '@system/types/hooks';

// Settings
import { getSystemSetting, KEYBINDINGS, SETTINGS } from '@system/settings';

// Utils
import {
    areKeysPressed,
    getApplyTargets,
    getConstantFromRoll,
    TargetDescriptor,
} from '@system/utils/generic';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';

// Dialogs
import { DamageModifierDialog } from '@system/applications/actor/dialogs/damage-card-modifier';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';

export const MESSAGE_TYPES = {
    SKILL: 'skill',
    ACTION: 'action',
    INJURY: 'injury',
    DAMAGE_TAKEN: 'taken',
} as Record<string, string>;

export class CosmereChatMessage extends ChatMessage {
    private useGraze = false;
    private totalDamageNormal = 0;
    private totalDamageGraze = 0;

    /* --- Accessors --- */
    public get actorSource(): CosmereActor | null {
        // NOTE: game.scenes resolves to any type
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-member-access */
        if (this.speaker.scene && this.speaker.token) {
            const scene = game.scenes.get(this.speaker.scene);
            const token = scene?.tokens?.get(this.speaker.token);
            if (token) return token.actor;
        }
        return game.actors?.get(this.speaker.actor);
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-member-access */
    }

    public get itemSource(): CosmereItem | null {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        return this.actorSource
            ? (this.actorSource.items.get(this.flags[SYSTEM_ID].message.item) ??
                  null)
            : null;
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    }

    public get d20Rolls(): D20Roll[] {
        return this.rolls.filter((r) => r instanceof D20Roll);
    }

    public get damageRolls(): DamageRoll[] {
        return this.rolls.filter((r) => r instanceof DamageRoll);
    }

    public get hasSkillTest(): boolean {
        return this.d20Rolls.length > 0;
    }

    public get hasDamage(): boolean {
        return this.damageRolls.length > 0;
    }

    public get hasInjury(): boolean {
        return this.getFlag(SYSTEM_ID, MESSAGE_TYPES.INJURY) !== undefined;
    }

    public get hasDamageTaken(): boolean {
        return (
            this.getFlag(SYSTEM_ID, MESSAGE_TYPES.DAMAGE_TAKEN) !== undefined
        );
    }

    public get headerImg(): string | undefined {
        return this.getFlag(SYSTEM_ID, 'headerImg');
    }

    /* --- Rendering --- */
    public override async getHTML(): Promise<JQuery> {
        const html = await super.getHTML();

        // Enrich the chat card
        await this.enrichCardHeader(html);
        await this.enrichCardContent(html);

        html.find('.enricher-link > a').on('click', (event) =>
            event.stopPropagation(),
        );
        html.find('.collapsible').on('click', (event) =>
            this.onClickCollapsible(event),
        );

        return html;
    }

    protected async enrichCardHeader(html: JQuery) {
        const actor = this.actorSource;

        let img;
        let name;

        if (this.isContentVisible) {
            img = this.headerImg ?? actor?.img ?? this.author.avatar;
            name = this.alias;
        } else {
            img = this.author.avatar;
            name = this.author.name;
        }

        const headerHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_HEADER,
            {
                img,
                name,
                subtitle:
                    name !== this.author.name ? this.author.name : undefined,
                timestamp: html.find('.message-timestamp').text(),
                canRepeat: this.hasSkillTest || this.hasDamage,
            },
        );

        // Replace header
        html.find('.message-header').replaceWith(headerHTML);

        const deleteButton = html
            .find('.message-metadata')
            .find('.message-delete');
        if (!game.user!.isGM) deleteButton?.remove();

        html.find('.message-repeat').on('click', (event) => {
            void this.onClickRepeat(event);
        });
    }

    protected async enrichCardContent(html: JQuery) {
        if (!this.isContentVisible) return;

        const type = this.getFlag(SYSTEM_ID, 'message.type') as string;
        if (!type || !Object.values(MESSAGE_TYPES).includes(type)) return;

        const content = $(
            await renderSystemTemplate(TEMPLATES.CHAT_CARD_CONTENT, {}),
        );

        this.enrichDescription(content);
        await this.enrichSkillTest(content);
        await this.enrichDamage(content);
        await this.enrichInjury(content);
        await this.enrichDamageTaken(content);
        await this.enrichTestTargets(content);

        // Replace content
        html.find('.message-content').replaceWith(content);

        // Setup hover buttons when the message is actually hovered(for optimisation).
        let hoverSetupComplete = false;
        content.on('mouseenter', async () => {
            if (!hoverSetupComplete) {
                hoverSetupComplete = true;
                await this.enrichCardOverlay(content);
            }
            this.onOverlayHoverStart(content);
        });

        content.on('mouseleave', () => {
            this.onOverlayHoverEnd(content);
        });

        // Run hover end once to ensure all hover buttons are in the correct state.
        this.onOverlayHoverEnd(content);
    }

    protected enrichDescription(html: JQuery) {
        const description = this.getFlag(
            SYSTEM_ID,
            'message.description',
        ) as string;
        if (!description) return;

        html.find('.chat-card').append(description);
    }

    protected async enrichSkillTest(html: JQuery) {
        if (!this.hasSkillTest) return;

        const d20Roll = this.d20Rolls[0];
        const skill = d20Roll?.options?.data?.skill;

        if (!skill) return;

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_SECTION,
            {
                type: 'skill',
                icon: 'fa-regular fa-dice-d20',
                title: game.i18n!.localize('GENERIC.SkillTest'),
                subtitle: {
                    skill: skill.id
                        ? CONFIG.COSMERE.skills[skill.id].label
                        : `${game.i18n!.localize('GENERIC.Custom')} ${game.i18n!.localize('GENERIC.Skill')}`,
                    attribute: skill.attribute
                        ? CONFIG.COSMERE.attributes[
                              d20Roll?.options?.defaultAttribute ??
                                  skill.attribute
                          ].labelShort
                        : game.i18n?.localize('GENERIC.None'),
                },
                content: await d20Roll.getHTML(),
            },
        );

        const section = $(sectionHTML as unknown as HTMLElement);
        const tooltip = section.find('.dice-tooltip');
        this.enrichD20Tooltip(d20Roll, tooltip[0]);
        tooltip.prepend(section.find('.dice-formula'));

        html.find('.chat-card').append(section);
    }

    protected async enrichTestTargets(html: JQuery) {
        if (!this.hasSkillTest) return;

        const targets = this.getFlag(
            SYSTEM_ID,
            'message.targets',
        ) as TargetDescriptor[];
        if (!targets || targets.length === 0) return;

        const d20Roll = this.d20Rolls[0];

        const success = '<i class="fas fa-check success"></i>';
        const failure = '<i class="fas fa-times failure"></i>';

        const targetData = [];
        for (const target of targets) {
            targetData.push({
                name: target.name,
                uuid: target.uuid,
                phyDef: target.def.phy,
                phyIcon:
                    (d20Roll.total ?? 0) >= target.def.phy ? success : failure,
                cogDef: target.def.cog,
                cogIcon:
                    (d20Roll.total ?? 0) >= target.def.cog ? success : failure,
                spiDef: target.def.spi,
                spiIcon:
                    (d20Roll.total ?? 0) >= target.def.spi ? success : failure,
            });
        }

        const trayHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_TRAY_TARGETS,
            {
                targets: targetData,
            },
        );

        const tray = $(trayHTML as unknown as HTMLElement);

        tray.find('li.target').on('click', (event) => {
            void this.onClickTarget(event);
        });

        html.find('.chat-card').append(tray);
    }

    protected async enrichDamage(html: JQuery) {
        if (!this.hasDamage) return;

        const damageRolls = this.damageRolls;

        this.totalDamageNormal = 0;
        this.totalDamageGraze = 0;

        let tooltipNormalHTML = '';
        let tooltipGrazeHTML = '';

        const partsNormal = [];
        const partsGraze = [];
        const types = new Set<[label: string, icon: string]>();

        for (const rollNormal of damageRolls) {
            const type = rollNormal.damageType
                ? game.i18n!.localize(
                      CONFIG.COSMERE.damageTypes[rollNormal.damageType].label,
                  )
                : '';
            const typeIcon = rollNormal.damageType
                ? `<img src="${CONFIG.COSMERE.damageTypes[rollNormal.damageType].icon}">`
                : '';

            types.add([type, typeIcon]);

            this.totalDamageNormal += rollNormal.total ?? 0;
            partsNormal.push(rollNormal.formula);
            const tooltipNormal = $(await rollNormal.getTooltip());
            this.enrichDamageTooltip(rollNormal, type, typeIcon, tooltipNormal);
            tooltipNormalHTML +=
                tooltipNormal.find('.tooltip-part')[0]?.outerHTML || ``;
            if (rollNormal.options.graze) {
                const rollGraze = DamageRoll.fromData(
                    rollNormal.options
                        .graze as unknown as foundry.dice.Roll.Data,
                );

                this.totalDamageGraze += rollGraze.total ?? 0;
                partsGraze.push(rollGraze.formula);
                const tooltipGraze = $(await rollGraze.getTooltip());
                this.enrichDamageTooltip(
                    rollGraze,
                    type,
                    typeIcon,
                    tooltipGraze,
                );
                tooltipGrazeHTML +=
                    tooltipGraze.find('.tooltip-part')[0]?.outerHTML || '';
            }
        }

        const critical = damageRolls.some((d) => d.isCritical);

        const damageHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_ROLL_DAMAGE,
            {
                formulaNormal: partsNormal.join(' + '),
                formulaGraze: partsGraze.join(' + '),
                tooltipNormal: tooltipNormalHTML,
                tooltipGraze: tooltipGrazeHTML,
                totalNormal: this.totalDamageNormal,
                totalGraze: this.totalDamageGraze,
                critical,
                showGraze: this.damageRolls.some((roll) => roll.options.graze),
            },
        );

        const footer = getSystemSetting(SETTINGS.CHAT_ENABLE_APPLY_BUTTONS)
            ? await renderSystemTemplate(TEMPLATES.CHAT_CARD_DAMAGE_BUTTONS, {
                  overlay: !getSystemSetting(SETTINGS.CHAT_ALWAYS_SHOW_BUTTONS),
              })
            : undefined;

        const isHealing = this.damageRolls.some(
            (r) => r.damageType === DamageType.Healing,
        );

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_SECTION,
            {
                type: 'damage',
                // This will need to be handled better when we do proper multi damage support
                icon: `fas ${isHealing ? 'fa-heart' : 'fa-heart-crack'}`,
                title: game.i18n!.localize(
                    isHealing ? 'GENERIC.Healing' : 'GENERIC.Damage',
                ),
                content: damageHTML,
                footer,
                critical,
                damageTypes: Array.from(types)
                    .map((type) => `${type[0]} ${type[1]}`)
                    .sort()
                    .join(' | '),
            },
        );

        const section = $(sectionHTML as unknown as HTMLElement);

        section.find('.dice-subtotal').on('click', (event) => {
            this.onSwitchDamageMode(event);
        });

        section.find('.apply-buttons button').on('click', async (event) => {
            await this.onClickApplyButton(event);
        });

        html.find('.chat-card').append(section);
    }

    protected async enrichInjury(html: JQuery) {
        if (!this.hasInjury) return;

        const injury = TableResult.fromSource(
            this.getFlag(SYSTEM_ID, 'injury.details'),
        );
        const injuryRoll = Roll.fromData(
            this.getFlag(SYSTEM_ID, 'injury.roll'),
        );

        const data: { type: InjuryType; durationFormula: string } =
            injury?.getFlag(SYSTEM_ID, 'injury-data');
        const durationRoll = this.rolls.find(
            (r) => !(r instanceof D20Roll) && !(r instanceof DamageRoll),
        );

        let title;
        const actor = this.actorSource?.name ?? 'Actor';
        switch (data.type) {
            case InjuryType.Death:
                title = game.i18n!.format(
                    'COSMERE.ChatMessage.InjuryDuration.Dead',
                    { actor },
                );
                break;
            case InjuryType.PermanentInjury:
                title = game.i18n!.format(
                    'COSMERE.ChatMessage.InjuryDuration.Permanent',
                    { actor },
                );
                break;
            default: {
                title = game.i18n!.format(
                    'COSMERE.ChatMessage.InjuryDuration.Temporary',
                    { actor, days: durationRoll?.total ?? 0 },
                );
                break;
            }
        }

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_INJURY,
            {
                title,
                img: injury.img,
                description: injury.text,
                formula: injuryRoll?.formula,
                total: injuryRoll?.total,
                tooltip: await injuryRoll?.getTooltip(),
                type: game.i18n!.localize(
                    CONFIG.COSMERE.injury.types[data.type].label,
                ),
            },
        );

        const section = $(sectionHTML as unknown as HTMLElement);
        const tooltip = section.find('.dice-tooltip');
        this.enrichD20Tooltip(injuryRoll, tooltip[0]);
        tooltip.prepend(section.find('.dice-formula'));

        if (game.user!.isGM || this.isAuthor) {
            section.find('.icon.clickable').on('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                // Handle interaction hook
                if (this.onInteraction(event) === false) return;

                const button = event.currentTarget;
                const action = button.dataset.action;

                if (action === 'apply') {
                    const duration = durationRoll?.total ?? 0;

                    /**
                     * Hook: preApplyInjury
                     *
                     * Passes the injury data
                     */
                    if (
                        Hooks.call<CosmereHooks.PreApplyInjury>(
                            HOOKS.PRE_APPLY_INJURY,
                            this,
                            this.actorSource,
                            { type: data.type, duration },
                        ) === false
                    )
                        return;

                    const injuryItem = (await Item.create(
                        {
                            type: ItemType.Injury,
                            name: game.i18n!.localize(
                                CONFIG.COSMERE.injury.types[data.type].label,
                            ),
                            system: {
                                duration: {
                                    remaining: duration,
                                },
                            },
                        },
                        { parent: this.actorSource },
                    )) as unknown as InjuryItem;

                    /**
                     * Hook: applyInjury
                     *
                     * Passes the created injury item
                     */
                    Hooks.callAll<CosmereHooks.ApplyInjury>(
                        HOOKS.APPLY_INJURY,
                        this,
                        this.actorSource,
                        injuryItem,
                    );
                }
            });
        } else {
            section.find('.icon.clickable').remove();
        }

        html.find('.chat-card').append(section);
    }

    protected async enrichDamageTaken(html: JQuery) {
        if (!this.hasDamageTaken) return;

        const {
            health,
            damageTaken,
            damageDeflect,
            damageIgnore,
            damageImmune,
            appliedImmunities,
            target,
            undo,
        } = this.getFlag(SYSTEM_ID, MESSAGE_TYPES.DAMAGE_TAKEN) as {
            health: number;
            damageTaken: number;
            damageDeflect: number;
            damageIgnore: number;
            damageImmune: number;
            appliedImmunities: Record<DamageType, number>;
            target: string;
            undo: boolean;
        };

        const actor = (await fromUuid(target)) as unknown as CosmereActor;

        if (!actor) return;

        // Whether or not the damage is actually healing
        const isHealing = damageTaken < 0;

        let immunityList = Object.entries(appliedImmunities) as [
            DamageType,
            number,
        ][];
        immunityList = immunityList.sort(
            ([, amountA], [, amountB]) => amountB - amountA,
        );
        const immunitiesBreakdown = `<span class="immunity-total">${damageImmune} <i class="fas fa-shield"></i></span>`;
        const calculationDeflect =
            damageDeflect > 0
                ? `${actor.deflect} <i data-tooltip="COSMERE.Actor.Statistics.Deflect" class='fas fa-shield-halved'></i>`
                : undefined;
        const calculationIgnore =
            damageIgnore > 0
                ? `${damageIgnore} <i data-tooltip="COSMERE.Damage.IgnoreDeflect" class='fas fa-shield-slash'></i>`
                : undefined;
        const calculationImmune =
            damageImmune > 0 ? immunitiesBreakdown : undefined;

        // Combine calculations
        const calculation = [
            [
                damageDeflect + damageImmune,
                calculationDeflect,
                calculationImmune,
            ]
                .filter((v) => !!v)
                .join(' - '),
            calculationIgnore,
        ]
            .filter((v) => !!v)
            .join(' + ');

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_DAMAGE_TAKEN,
            {
                type: isHealing ? 'healing' : 'injury',
                img: isHealing
                    ? 'icons/magic/life/cross-beam-green.webp'
                    : 'icons/skills/wounds/injury-stitched-flesh-red.webp',
                title: game.i18n!.format(
                    `COSMERE.ChatMessage.${isHealing ? 'ApplyHealing' : 'ApplyDamage'}`,
                    { actor: actor.name, amount: Math.abs(damageTaken) },
                ),
                subtitle: isHealing
                    ? undefined
                    : game.i18n!.format(
                          'COSMERE.ChatMessage.DamageCalculation',
                          { calculation },
                      ),
                tooltip: isHealing
                    ? 'COSMERE.ChatMessage.Buttons.UndoHealing'
                    : 'COSMERE.ChatMessage.Buttons.UndoDamage',
                undo,
            },
        );

        const section = $(sectionHTML as unknown as HTMLElement);

        if (game.user!.isGM || this.isAuthor) {
            section.find('.icon.clickable').on('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                // Handle interaction hook
                if (this.onInteraction(event) === false) return;

                const button = event.currentTarget;
                const action = button.dataset.action;

                if (action === 'undo') {
                    await actor.update({
                        'system.resources.hea.value':
                            actor.system.resources[Resource.Health].value +
                            (health > damageTaken ? damageTaken : health),
                    });

                    await this.setFlag(SYSTEM_ID, 'taken.undo', false);
                    void this.update({ flags: this.flags });
                }
            });
        } else {
            section.find('.icon.clickable').remove();
        }

        const immunitiesTooltip = document.createElement('div');
        immunitiesTooltip.classList.add('immunity-tooltip');
        immunitiesTooltip.innerHTML = `
            <span>${game.i18n?.localize('COSMERE.Actor.Statistics.Immunities')}</span>
            ${immunityList
                .map(
                    ([damageType, amount]) => `
                <div class="immunity">
                    <i class="fas fa-shield"></i>
                    <span>${game.i18n!.localize(CONFIG.COSMERE.damageTypes[damageType].label)} ${amount}</span>
                </div>
                `,
                )
                .join('')}`;
        section.find('.immunity-total').on('mouseover', (event) => {
            game.tooltip?.activate(event.target, {
                content: immunitiesTooltip,
            });
        });

        html.find('.chat-card').append(section);
    }

    /**
     * Augment damage roll tooltips with some additional information and styling.
     * @param {DamageRoll} roll The roll instance.
     * @param {string} type The type of the damage as a string.
     * @param {string} icon The icon of the damage type as a path string.
     * @param {JQuery} html The roll tooltip markup.
     * @returns
     */
    protected enrichDamageTooltip(
        roll: DamageRoll,
        type: string,
        icon: string,
        html: JQuery,
    ) {
        html.find('.label').text(type);
        html.find('.label').parent().prepend(icon);

        const constant = getConstantFromRoll(roll);
        if (constant === 0) return;

        const sign = constant < 0 ? '-' : '+';
        const newTotal = Number(html.find('.value').text()) + constant;

        if (roll.hasDice) html.find('.value').text(newTotal);

        html.find('.dice-rolls').append(
            `<li class="constant">
                ${
                    roll.hasDice || constant < 0
                        ? `<span class="sign">${sign}</span>`
                        : ''
                }
                ${constant}
            </li>`,
        );
    }

    /**
     * Augment d20 roll tooltips with some additional information and styling.
     * @param {Roll} roll The roll instance.
     * @param {HTMLElement} html The roll tooltip markup.
     */
    protected enrichD20Tooltip(roll: Roll, html: HTMLElement) {
        const constant = getConstantFromRoll(roll);
        if (constant === 0) return;

        const sign = constant < 0 ? '-' : '+';
        const part = document.createElement('section');
        part.classList.add('tooltip-part', 'constant');
        part.innerHTML = `
            <div class="dice">
                <ol class="dice-rolls"></ol>
                <div class="total">
                <span class="value"><span class="sign">${sign}</span>${Math.abs(constant)}</span>
                </div>
            </div>
            `;
        html.appendChild(part);
    }

    /**
     * Adds overlay buttons to a chat card for retroactively making a roll into a multi roll or a crit.
     * @param {JQuery} html The object to add overlay buttons to.
     */
    protected async enrichCardOverlay(html: JQuery) {
        if (!getSystemSetting(SETTINGS.CHAT_ENABLE_OVERLAY_BUTTONS)) return;

        const overlayD20 = await renderSystemTemplate(
            TEMPLATES.CHAT_OVERLAY_D20,
            {
                imgAdvantage: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_adv.svg`,
                imgDisadvantage: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_dis.svg`,
            },
        );

        html.find('.dice-roll-d20 .dice-total').append($(overlayD20));
        html.find('.overlay-d20 div').on('click', async (event) => {
            await this.onClickOverlayD20(event);
        });

        const overlayCrit = await renderSystemTemplate(
            TEMPLATES.CHAT_OVERLAY_CRIT,
            {
                imgCrit: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro_crit.svg`,
            },
        );

        html.find('.dice-roll-damage .dice-total').append($(overlayCrit));
        html.find('.overlay-crit div').on('click', async (event) => {
            await this.onClickOverlayCrit(event);
        });
    }

    /**
     * Listen for shift key being pressed to show the chat message "delete" icon, or released (or focus lost) to hide it.
     */
    public static activateListeners() {
        window.addEventListener(
            'keydown',
            () => this.toggleModifiers({ releaseAll: false }),
            { passive: true },
        );
        window.addEventListener(
            'keyup',
            () => this.toggleModifiers({ releaseAll: false }),
            { passive: true },
        );
        window.addEventListener(
            'blur',
            () => this.toggleModifiers({ releaseAll: true }),
            { passive: true },
        );
    }

    /**
     * Toggles attributes on the chatlog based on which modifier keys are being held.
     * @param {object} [options]
     * @param {boolean} [options.releaseAll=false]  Force all modifiers to be considered released.
     */
    private static toggleModifiers({ releaseAll = false }) {
        document.querySelectorAll('.chat-sidebar > ol').forEach((chatlog) => {
            const chatlogHTML = chatlog as HTMLElement;
            for (const key of Object.values(KeyboardManager.MODIFIER_KEYS)) {
                if (game.keyboard!.isModifierActive(key) && !releaseAll)
                    chatlogHTML.dataset[`modifier${key}`] = '';
                else delete chatlogHTML.dataset[`modifier${key}`];
            }
        });
    }

    /* --- Handlers --- */

    /**
     * Handles a d20 overlay button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickOverlayD20(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;
        const state = button.dataset.state;

        if (action === 'retro' && state) {
            const roll = this.d20Rolls[0];

            const d20BaseTerm = roll.terms.find(
                (d) => d instanceof foundry.dice.terms.Die && d.faces === 20,
            ) as foundry.dice.terms.Die;

            if (!d20BaseTerm || d20BaseTerm.number === 2) return;

            const d20Additional = await new Roll(
                `${2 - d20BaseTerm.number!}d20${d20BaseTerm.modifiers.join('')}`,
            ).evaluate();

            const modifiers = new Array<
                keyof (typeof foundry.dice.terms.Die)['MODIFIERS']
            >();
            d20BaseTerm.modifiers.forEach((m) =>
                modifiers.push(
                    m as keyof (typeof foundry.dice.terms.Die)['MODIFIERS'],
                ),
            );

            const d20Forced = new foundry.dice.terms.Die({
                number: 2,
                faces: 20,
                results: [
                    ...d20BaseTerm.results,
                    ...d20Additional.dice[0].results,
                ],
                modifiers,
            });
            d20Forced.keep(state);
            d20Forced.modifiers.push(state);

            roll.terms[roll.terms.indexOf(d20BaseTerm)] = d20Forced;
            roll.options.advantageMode =
                state === 'kh'
                    ? AdvantageMode.Advantage
                    : state === 'kl'
                      ? AdvantageMode.Disadvantage
                      : AdvantageMode.None;

            roll.resetFormula();
            roll.resetTotal();

            void this.update({ rolls: this.rolls });
        }
    }

    /**
     * Handles a crit overlay button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickOverlayCrit(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;

        if (action === 'retro') {
            const clone = await Promise.all(
                this.rolls.map(async (roll) => {
                    if (!(roll instanceof DamageRoll)) return roll;

                    const crit = new DamageRoll(roll.formula, roll.data, {
                        damageType: roll.damageType,
                        mod: roll.mod,
                        damageSourceName: roll.damageSourceName,
                        advantageMode:
                            roll.options.advantageMode ?? AdvantageMode.None,
                        maximize: true,
                        minimize: false,
                        critical: true,
                    });

                    roll.dice.forEach((die, index) => {
                        die.results.forEach((r) => (r.result = die.faces ?? 0));
                        crit.dice[index].results = die.results;
                    });

                    await crit.evaluate();

                    if (roll.graze) {
                        const graze = new DamageRoll(
                            roll.graze.formula,
                            roll.graze.data,
                            {
                                damageType: roll.graze.damageType,
                                mod: roll.graze.mod,
                                damageSourceName: roll.graze.damageSourceName,
                                advantageMode:
                                    roll.graze.options.advantageMode ??
                                    AdvantageMode.None,
                                maximize: true,
                                minimize: false,
                                critical: true,
                            },
                        );

                        DamageRoll.fromData(
                            roll.graze as unknown as foundry.dice.Roll.Data,
                        ).dice.forEach((die, index) => {
                            die.results.forEach(
                                (r) => (r.result = die.faces ?? 0),
                            );
                            graze.dice[index].results = die.results;
                        });

                        await graze.evaluate();
                        crit.graze = graze;
                    }

                    return crit;
                }),
            );

            void this.update({ rolls: clone });
        }
    }

    /**
     * Handles a click event on the toggle between using graze damage and full damage.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     * @returns
     */
    private onSwitchDamageMode(event: JQuery.ClickEvent) {
        const toggle = $(event.currentTarget as HTMLElement);

        if (toggle.hasClass('active')) return;

        event.preventDefault();
        event.stopPropagation();

        this.useGraze = !this.useGraze;
        toggle.addClass('active');
        toggle.siblings('.dice-subtotal').removeClass('active');

        if (toggle.siblings('.overlay-crit').first().hasClass('left')) {
            toggle
                .siblings('.overlay-crit.left')
                .removeClass('left')
                .addClass('right');
        } else if (toggle.siblings('.overlay-crit').first().hasClass('right')) {
            toggle
                .siblings('.overlay-crit.right')
                .removeClass('right')
                .addClass('left');
        }
    }

    /**
     * Handles a repeat button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickRepeat(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const clone = await Promise.all(
            this.rolls.map(async (roll) => await roll.reroll()),
        );

        void ChatMessage.create({
            user: game.user!.id,
            speaker: this.speaker,
            flags: this.flags,
            rolls: clone,
        });
    }

    /**
     * Handles an apply button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickApplyButton(
        event: JQuery.ClickEvent,
        forceRolls = null,
    ) {
        event.preventDefault();
        event.stopPropagation();

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const button = event.currentTarget as HTMLElement;
        const promptModify =
            !getSystemSetting(SETTINGS.DIALOG_DAMAGE_MODIFIER_SKIP_DEFAULT) ||
            areKeysPressed(KEYBINDINGS.SKIP_DIALOG_DEFAULT);
        const action = button.dataset.action;
        const multiplier = Number(button.dataset.multiplier);

        const targets = getApplyTargets();
        if (targets.size === 0) return;

        if (action === 'apply-damage' && multiplier) {
            const modifier = promptModify
                ? await DamageModifierDialog.show({
                      isHealing: multiplier < 0,
                      action: action,
                  })
                : 0;
            const damageRolls = forceRolls ?? this.damageRolls;
            const damageToApply = damageRolls.map((r) => ({
                amount:
                    (this.useGraze
                        ? (r.graze?.total ?? 0) + modifier
                        : (r.total ?? 0) + modifier) * Math.abs(multiplier),
                type: multiplier < 0 ? DamageType.Healing : r.damageType,
            }));

            await Promise.all(
                Array.from(targets).map(async (t) => {
                    const target = (t as Token).actor as CosmereActor;
                    return await target.applyDamage(damageToApply, {
                        originatingItem: this.itemSource ?? undefined,
                    });
                }),
            );
        }

        if (action === 'reduce-focus') {
            const modifier = promptModify
                ? await DamageModifierDialog.show({
                      isHealing: multiplier < 0,
                      action: action,
                  })
                : 0;
            await Promise.all(
                Array.from(targets).map(async (t) => {
                    const target = (t as Token).actor as CosmereActor;
                    return await target.update({
                        'system.resources.foc.value':
                            target.system.resources.foc.value - (1 + modifier),
                    });
                }),
            );
        }
    }

    /**
     * Handles collapsible sections expansion on click event.
     * @param {JQuery.ClickEvent} event  The triggering event.
     */
    private onClickCollapsible(event: JQuery.ClickEvent) {
        const directTarget = event.target as HTMLElement;

        if (
            directTarget.hasAttribute('data-link') ||
            directTarget.classList.contains('inline-roll')
        ) {
            return;
        }

        event.stopPropagation();
        const target = event.currentTarget as HTMLElement;
        target?.classList.toggle('expanded');
    }

    /**
     * Handle target selection and panning.
     * @param {JQuery.ClickEvent} event The triggering event.
     * @returns {Promise} A promise that resolves once the canvas pan has completed.
     * @protected
     */
    private async onClickTarget(event: JQuery.ClickEvent) {
        event.stopPropagation();
        const uuid = (event.currentTarget as HTMLElement).dataset.uuid;

        if (!uuid) return;

        const actor = fromUuidSync(uuid) as CosmereActor;
        const token = actor?.getActiveTokens()[0] as Token;

        if (!token) return;

        const releaseOthers = !event.shiftKey;
        if (token.controlled) token.release();
        else {
            token.control({ releaseOthers });
            return game.canvas!.animatePan(token.center);
        }
    }

    /**
     * Handles hover begin events on the given html/jquery object.
     * @param {JQuery} html The object to handle hover begin events for.
     * @private
     */
    private onOverlayHoverStart(html: JQuery) {
        const hasPermission = game.user!.isGM || this.isAuthor;

        html.find('.overlay').show();
        html.find('.overlay-d20').toggle(
            hasPermission &&
                this.hasSkillTest &&
                !(
                    this.d20Rolls[0].hasAdvantage ||
                    this.d20Rolls[0].hasDisadvantage
                ),
        );
        html.find('.overlay-crit').toggle(
            hasPermission &&
                this.hasDamage &&
                this.damageRolls.every((r) => !r.isCritical),
        );
    }

    /**
     * Handles hover end events on the given html/jquery object.
     * @param {JQuery} html The object to handle hover end events for.
     * @private
     */
    private onOverlayHoverEnd(html: JQuery) {
        html.find('.overlay').attr('style', 'display: none;');
    }

    /**
     * Helpers
     */

    /**
     * Call interaction hook
     * @param event
     * @private
     */
    private onInteraction(event: JQuery.Event): boolean {
        /**
         * Hook: chatMessageInteract
         *
         * Pass message and triggering event
         */
        return Hooks.call<CosmereHooks.MessageInteract>(
            HOOKS.MESSAGE_INTERACTED,
            this,
            event,
        );
    }
}
