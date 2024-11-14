import { DamageType, InjuryType } from '@system/types/cosmere';
import { D20Roll } from '@system/dice/d20-roll';
import { DamageRoll } from '@system/dice/damage-roll';

import { CosmereActor } from './actor';
import { renderSystemTemplate, TEMPLATES } from '../utils/templates';
import { SYSTEM_ID } from '../constants';
import { AdvantageMode } from '../types/roll';
import { getSystemSetting, SETTINGS } from '../settings';
import { getApplyTargets } from '../utils/generic';

export const MESSAGE_TYPES = {
    SKILL: 'skill',
    ACTION: 'action',
    INJURY: 'injury',
} as Record<string, string>;

export class CosmereChatMessage extends ChatMessage {
    private useGraze = false;
    private totalDamageNormal = 0;
    private totalDamageGraze = 0;

    /* --- Accessors --- */
    public get associatedActor(): CosmereActor | null {
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
        return this.getFlag(SYSTEM_ID, 'injury') !== undefined;
    }

    /* --- Rendering --- */
    public override async getHTML(): Promise<JQuery> {
        const html = await super.getHTML();

        // Enrich the chat card
        await this.enrichCardHeader(html);
        await this.enrichCardContent(html);

        html.find('.collapsible').on('click', (event) =>
            this.onClickCollapsible(event),
        );
        //await this.enrichChatCard(html);

        return html;
    }

    protected async enrichCardHeader(html: JQuery) {
        const actor = this.associatedActor;

        let img;
        let name;

        if (this.isContentVisible) {
            img = actor?.img ?? this.author.avatar;
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
                    skill: CONFIG.COSMERE.skills[skill.id].label,
                    attribute:
                        CONFIG.COSMERE.attributes[skill.attribute].labelShort,
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

    protected async enrichDamage(html: JQuery) {
        if (!this.hasDamage) return;

        const damageRolls = this.damageRolls;

        this.totalDamageNormal = 0;
        this.totalDamageGraze = 0;

        let tooltipNormalHTML = '';
        let tooltipGrazeHTML = '';

        const partsNormal = [];
        const partsGraze = [];

        for (const rollNormal of damageRolls) {
            const type = rollNormal.damageType
                ? game.i18n!.localize(
                      CONFIG.COSMERE.damageTypes[rollNormal.damageType].label,
                  )
                : '';

            this.totalDamageNormal += rollNormal.total ?? 0;
            partsNormal.push(rollNormal.formula);
            const tooltipNormal = $(await rollNormal.getTooltip());
            tooltipNormal.find('.label').text(type);
            tooltipNormalHTML +=
                tooltipNormal.find('.tooltip-part')[0].outerHTML;

            if (rollNormal.options.graze) {
                const rollGraze = DamageRoll.fromData(
                    rollNormal.options
                        .graze as unknown as foundry.dice.Roll.Data,
                );

                this.totalDamageGraze += rollGraze.total ?? 0;
                partsGraze.push(rollGraze.formula);
                const tooltipGraze = $(await rollGraze.getTooltip());
                tooltipGraze.find('.label').text(type);
                tooltipGrazeHTML +=
                    tooltipGraze.find('.tooltip-part')[0].outerHTML;
            }
        }

        const damageHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_ROLL_DAMAGE,
            {
                formulaNormal: partsNormal.join(' + '),
                formulaGraze: partsGraze.join(' + '),
                tooltipNormal: tooltipNormalHTML,
                tooltipGraze: tooltipGrazeHTML,
                totalNormal: this.totalDamageNormal,
                totalGraze: this.totalDamageGraze,
            },
        );

        const footer = getSystemSetting(SETTINGS.CHAT_ENABLE_APPLY_BUTTONS)
            ? await renderSystemTemplate(TEMPLATES.CHAT_CARD_DAMAGE_BUTTONS, {
                  overlay: !getSystemSetting(SETTINGS.CHAT_ALWAYS_SHOW_BUTTONS),
              })
            : undefined;

        const sectionHTML = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_SECTION,
            {
                type: 'damage',
                icon: 'fa-solid fa-burst',
                title: game.i18n!.localize('GENERIC.Damage'),
                content: damageHTML,
                footer,
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

        // Current required because of a bug in the roll table
        if ((data.type as string) === 'ViciousInjury')
            data.type = InjuryType.ViciousInjury;

        let title;
        const actor = this.associatedActor?.name ?? 'Actor';
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

        html.find('.chat-card').append(section);
    }

    /**
     * Augment roll tooltips with some additional information and styling.
     * @param {Roll} roll The roll instance.
     * @param {HTMLElement} html The roll tooltip markup.
     */
    protected enrichD20Tooltip(roll: Roll, html: HTMLElement) {
        let previous: unknown;
        let constant = 0;
        for (const term of roll.terms) {
            if (term instanceof foundry.dice.terms.NumericTerm) {
                if (
                    previous instanceof foundry.dice.terms.OperatorTerm &&
                    previous.operator === '-'
                ) {
                    constant -= term.number;
                } else {
                    constant += term.number;
                }
            }
            previous = term;
        }

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
                imgAdvantage: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro-adv.svg`,
                imgDisadvantage: `systems/${SYSTEM_ID}/assets/icons/svg/dice/retro-dis.svg`,
            },
        );

        html.find('.dice-roll-d20 .dice-total').append($(overlayD20));
        html.find('.overlay-d20 div').on('click', async (event) => {
            await this.onClickOverlayD20(event);
        });

        //const overlayCrit = await renderSystemTemplate(TEMPLATES.CHAT_OVERLAY_CRIT, {});

        // html.find('.rsr-damage .dice-total').append($(overlayCrit));

        // html.find(".rsr-overlay-crit div").click(async event => {
        //     await _processRetroCritButtonEvent(message, event);
        // });
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

            void this.update({ rolls: this.rolls });
        }
    }

    private onSwitchDamageMode(event: JQuery.ClickEvent) {
        const toggle = $(event.currentTarget as HTMLElement);

        if (toggle.css('opacity') === '0') return;

        event.preventDefault();
        event.stopPropagation();

        this.useGraze = !this.useGraze;
        toggle.attr('style', 'opacity: 0;');
        toggle.siblings('.dice-subtotal').attr('style', '');
        toggle
            .siblings('p')
            .text(
                this.useGraze ? this.totalDamageGraze : this.totalDamageNormal,
            );
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

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;
        const multiplier = Number(button.dataset.multiplier);

        const targets = getApplyTargets();
        if (targets.size === 0) return;

        if (action === 'apply-damage' && multiplier) {
            const damageRolls = forceRolls ?? this.damageRolls;
            const damageToApply = damageRolls.map((r) => ({
                amount:
                    (this.useGraze ? (r.graze?.total ?? 0) : (r.total ?? 0)) *
                    Math.abs(multiplier),
                type: multiplier < 0 ? DamageType.Healing : r.damageType,
            }));

            await Promise.all(
                Array.from(targets).map(async (t) => {
                    const target = (t as Token).actor as CosmereActor;
                    return await target.applyDamage(...damageToApply);
                }),
            );
        }

        if (action === 'reduce-focus') {
            await Promise.all(
                Array.from(targets).map(async (t) => {
                    const target = (t as Token).actor as CosmereActor;
                    return await target.update({
                        'system.resources.foc.value':
                            target.system.resources.foc.value - 1,
                    });
                }),
            );
        }
    }

    /**
     * Handles collapsible sections expansion on click event.
     * @param {PointerEvent} event  The triggering event.
     */
    private onClickCollapsible(event: JQuery.ClickEvent) {
        event.stopPropagation();
        const target = event.currentTarget as HTMLElement;
        target?.classList.toggle('expanded');
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
        html.find('.overlay-crit').toggle(hasPermission && this.hasDamage);
    }

    /**
     * Handles hover end events on the given html/jquery object.
     * @param {JQuery} html The object to handle hover end events for.
     * @private
     */
    private onOverlayHoverEnd(html: JQuery) {
        html.find('.overlay').attr('style', 'display: none;');
    }
}
