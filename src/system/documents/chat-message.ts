import {
    AdvantageMode,
    CosmereDamageRoll,
    CosmereDamageRollOptions,
    CosmereInjuryRoll,
    CosmereInjuryRollData,
    CosmerePlotRoll,
    CosmereRoll,
    CosmereSkillRoll,
    CosmereSkillRollOptions,
    DieModifier,
} from '../dice';
import { getSystemSetting, SETTINGS } from '../settings';
import { ItemType } from '../types/cosmere';
import { determineConfigurationMode, TargetDescriptor } from '../utils/generic';
import { renderSystemTemplate, TEMPLATES } from '../utils/templates';
import { CosmereActor } from './actor';
import { InjuryItem } from './item';
import { HOOKS } from '@system/constants/hooks';

export class CosmereChatMessage<
    out SubType extends ChatMessage.SubType = ChatMessage.SubType,
> extends ChatMessage<SubType> {
    private graze = false;

    /* --- Rendering --- */
    public override async renderHTML(
        options?: ChatMessage.RenderHTMLOptions,
    ): Promise<HTMLElement> {
        const html = await super.renderHTML(options);

        await this.enrich(html);

        return html;
    }

    public async enrich(html: HTMLElement) {
        if (!this.isContentVisible) return;

        const description = (this.system as Record<string, unknown>)
            .description;
        if (description) {
            $(html)
                .find('.chat-card')
                .prepend(description as string);
        }

        const sections = $(html).find('.chat-card-section');

        for (const section of sections) {
            this.enrichOverlay(section);
            this.enrichTest(section);
            this.enrichDamage(section);
            this.enrichInjury(section);
        }

        await this.enrichTargets(html);

        $(html)
            .find('.enricher-link > a')
            .on('click', (event) => event.stopPropagation());

        $(html)
            .find('.tooltip-part .dice-rolls .roll')
            .on('click', (event) => this.onClickRerollDie(event));

        $(html)
            .find('.collapsible')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    private enrichOverlay(html: HTMLElement) {
        // Run hover end once to ensure all hover buttons are in the correct state.
        this.onOverlayHoverEnd(html);

        if (!getSystemSetting(SETTINGS.CHAT_ENABLE_OVERLAY_BUTTONS)) return;

        $(html).on('mouseenter', () => {
            this.onOverlayHoverStart(html);
        });

        $(html).on('mouseleave', () => {
            this.onOverlayHoverEnd(html);
        });
    }

    private enrichTest(html: HTMLElement) {
        if (!$(html).hasClass('skill')) return;

        $(html)
            .find('.overlay-d20 div')
            .on('click', async (event) => {
                await this.onClickOverlayD20(event);
            });
    }

    private enrichDamage(html: HTMLElement) {
        if (!$(html).hasClass('damage')) return;

        $(html)
            .find('.dice-subtotal')
            .on('click', (event) => {
                this.onSwitchDamageMode(event);
            });

        $(html)
            .find('.overlay-crit div')
            .on('click', async (event) => {
                await this.onClickOverlayCrit(event);
            });
    }

    private enrichInjury(html: HTMLElement) {
        if (!$(html).hasClass('injury')) return;

        if (this.isOwner) {
            $(html)
                .find('.icon.clickable')
                .on('click', (event) => {
                    void this.onClickApplyInjury(event);
                });
        } else {
            $(html).find('.icon.clickable').remove();
        }
    }

    protected async enrichTargets(html: HTMLElement) {
        const targets = (this.system as Record<string, unknown>)
            .targets as TargetDescriptor[];

        if (!targets || targets.length === 0) return;

        const test = this.rolls.find((r) => r instanceof CosmereSkillRoll);

        if (!test) return;

        const success = '<i class="fas fa-check success"></i>';
        const failure = '<i class="fas fa-times failure"></i>';

        const targetData = [];
        for (const target of targets) {
            targetData.push({
                name: target.name,
                uuid: target.uuid,
                phyDef: target.def.phy,
                phyIcon:
                    (test.total ?? 0) >= target.def.phy ? success : failure,
                cogDef: target.def.cog,
                cogIcon:
                    (test.total ?? 0) >= target.def.cog ? success : failure,
                spiDef: target.def.spi,
                spiIcon:
                    (test.total ?? 0) >= target.def.spi ? success : failure,
            });
        }

        const tray = await renderSystemTemplate(
            TEMPLATES.CHAT_CARD_TRAY_TARGETS,
            {
                targets: targetData,
            },
        );

        $(html).find('.chat-card').append(tray);

        $(html)
            .find('li.target')
            .on('click', (event) => {
                void this.onClickTarget(event);
            });
    }

    /* --- Modifiers --- */
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
    private static toggleModifiers({
        releaseAll = false,
    }: {
        releaseAll?: boolean;
    }) {
        const MODIFIER_KEYS = (
            foundry.helpers?.interaction?.KeyboardManager ?? KeyboardManager
        ).MODIFIER_KEYS;
        document
            .querySelectorAll('.chat-sidebar > ol, #chat .chat-scroll > ol')
            .forEach((chatlog) => {
                const chatlogHTML = chatlog as HTMLElement;
                for (const key of Object.values(MODIFIER_KEYS)) {
                    if (game.keyboard.isModifierActive(key) && !releaseAll)
                        chatlogHTML.dataset[`modifier${key}`] = '';
                    else delete chatlogHTML.dataset[`modifier${key}`];
                }
            });
    }

    /* --- Handlers --- */
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
     * Handles an individual die reroll button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickRerollDie(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const button = event.currentTarget as HTMLElement;
        const tooltip = button.closest('.tooltip-part')!;

        if (button.classList.contains('discarded')) return;

        const dieUUID = button.dataset.uuid;
        const rollUUID = (tooltip as HTMLElement).dataset.uuid;

        const roll = this.rolls.find(
            (r) => (r as unknown as CosmereRoll).uuid === rollUUID,
        );

        if (!roll || !(roll instanceof CosmereRoll)) return;

        const { fastForward, advantageMode, raiseStakes } =
            determineConfigurationMode({});

        if (fastForward) {
            if (
                raiseStakes &&
                roll instanceof CosmereSkillRoll &&
                !(roll.options as CosmereSkillRollOptions).raiseStakes
            ) {
                (roll.options as CosmereSkillRollOptions).raiseStakes = true;

                const data = foundry.utils.deepClone(roll.data);
                data.parent = roll.uuid;
                data.parts = ['1dp'];

                const plotRoll = new CosmerePlotRoll(
                    data.parts.join(' + '),
                    data,
                    {},
                );
                await plotRoll.evaluate();

                (this.rolls as unknown as CosmereRoll[]).push(plotRoll);
            }

            switch (advantageMode) {
                case AdvantageMode.Advantage:
                    await roll.modify(DieModifier.Advantage, dieUUID);
                    break;
                case AdvantageMode.Disadvantage:
                    await roll.modify(DieModifier.Disadvantage, dieUUID);
                    break;
                default:
                    break;
            }
        } else {
            await roll.modify(DieModifier.Pick, dieUUID);
        }

        void this.update({ rolls: this.rolls });
    }

    /**
     * Handles an injury application button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickApplyInjury(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;

        if (action === 'apply') {
            const section = button.closest('.chat-card-section.injury');
            const uuid = (section as HTMLElement).dataset.uuid;
            const roll = this.rolls.find(
                (r) => (r as unknown as CosmereRoll).uuid === uuid,
            );

            if (!roll || !(roll instanceof CosmereInjuryRoll)) return;

            /**
             * Hook: preApplyInjury
             *
             * Passes the injury data
             */
            if (
                Hooks.call(HOOKS.PRE_APPLY_INJURY, this, this.speakerActor, {
                    type: (roll.data as CosmereInjuryRollData).type,
                    duration: (roll.data as CosmereInjuryRollData).duration,
                }) === false
            )
                return;

            const injuryItem = (await Item.create(
                {
                    type: ItemType.Injury,
                    name: game.i18n.localize(
                        CONFIG.COSMERE.injury.types[
                            (roll.data as CosmereInjuryRollData).type
                        ].label,
                    ),
                    img: (roll.data as CosmereInjuryRollData).img,
                    system: {
                        type: (roll.data as CosmereInjuryRollData).type,
                        description: {
                            value: (roll.data as CosmereInjuryRollData).details,
                        },
                        duration: {
                            remaining: Math.max(
                                0,
                                (roll.data as CosmereInjuryRollData).duration,
                            ),
                        },
                    },
                },
                {
                    parent: this.speakerActor,
                },
            )) as unknown as InjuryItem;

            /**
             * Hook: applyInjury
             *
             * Passes the created injury item
             */
            Hooks.callAll(
                HOOKS.APPLY_INJURY,
                this,
                this.speakerActor,
                injuryItem,
            );
        }
    }

    /**
     * Handles a d20 overlay button click event.
     * @param {JQuery.ClickEvent} event The originating event of the button click.
     */
    private async onClickOverlayD20(event: JQuery.ClickEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;
        const state = button.dataset.state;

        if (action === 'retro' && state) {
            const section = button.closest('.chat-card-section.skill');
            const uuid = (section as HTMLElement).dataset.uuid;
            const roll = this.rolls.find(
                (r) => (r as unknown as CosmereRoll).uuid === uuid,
            );

            if (!roll || !(roll instanceof CosmereSkillRoll)) return;

            switch (state) {
                case 'kh':
                    await roll.modify(DieModifier.Advantage);
                    break;
                case 'kl':
                    await roll.modify(DieModifier.Disadvantage);
                    break;
                default:
                    break;
            }

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

        // Handle interaction hook
        if (this.onInteraction(event) === false) return;

        const button = event.currentTarget as HTMLElement;
        const action = button.dataset.action;

        if (action === 'retro') {
            const section = button.closest('.chat-card-section.damage');
            const uuid = (section as HTMLElement).dataset.uuid;
            const roll = this.rolls.find(
                (r) => (r as unknown as CosmereRoll).uuid === uuid,
            );

            if (!roll || !(roll instanceof CosmereDamageRoll)) return;

            // Also maximize all child rolls (e.g. graze override and temp bonuses)
            for (const crit of [
                roll,
                ...this.rolls.filter(
                    (r) => (r as unknown as CosmereRoll).parent === uuid,
                ),
            ]) {
                (crit.options as CosmereDamageRollOptions).critical = true;
                await crit.evaluate({ maximize: true });
            }

            void this.update({ rolls: this.rolls });
        }
    }

    /**
     * Handles hover begin events on the given HTML element.
     * @param {HTMLElement} html The element to handle hover begin events for.
     * @private
     */
    private onOverlayHoverStart(html: HTMLElement) {
        $(html).find('.overlay').show();

        const roll = this.rolls.find(
            (r) => (r as unknown as CosmereRoll).uuid === html.dataset.uuid,
        );

        if (!roll) return;

        if (roll instanceof CosmereSkillRoll) {
            $(html)
                .find('.overlay-d20')
                .toggle(
                    this.isOwner &&
                        !(roll.hasAdvantage || roll.hasDisadvantage),
                );
        }

        if (roll instanceof CosmereDamageRoll) {
            $(html)
                .find('.overlay-crit')
                .toggle(
                    this.isOwner &&
                        !(roll.options as CosmereDamageRollOptions).critical,
                );
        }
    }

    /**
     * Handles hover end events on the given HTML element.
     * @param {HTMLElement} html The element to handle hover end events for.
     * @private
     */
    private onOverlayHoverEnd(html: HTMLElement) {
        $(html).find('.overlay').attr('style', 'display: none;');
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

        this.graze = !this.graze;
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
        const token = actor?.getActiveTokens()[0];

        if (!token) return;

        const releaseOthers = !event.shiftKey;
        if (token.controlled) token.release();
        else {
            token.control({ releaseOthers });
            return game.canvas.animatePan(token.center);
        }
    }

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
        return Hooks.call(HOOKS.MESSAGE_INTERACTED, this, event);
    }
}
