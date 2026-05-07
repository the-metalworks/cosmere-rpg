import { RollMode } from '@system/dice/types';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';
import {
    CosmereDamageRoll,
    CosmereDamageRollData,
    CosmereDamageRollOptions,
    CosmerePlotRoll,
    CosmereRoll,
    CosmereRollOptions,
    CosmereSkillRoll,
    CosmereSkillRollData,
    CosmereSkillRollOptions,
    DieModifier,
    RollEvaluationOptions,
} from '@src/system/dice';
import { Attribute, Skill } from '@src/system/types/cosmere';
import { CosmereGrazeRoll } from '@src/system/dice/rolls/cosmere-roll-graze';

const { ApplicationV2 } = foundry.applications.api;

export namespace RollConfigurationDialog {
    export interface Data {
        /**
         * The title of the dialog window
         */
        title: string;

        /**
         * The input array of rolls to configure
         */
        rolls: CosmereRoll[];

        /**
         * The initial roll options applied to all rolls (e.g. roll mode)
         */
        options: CosmereRollOptions;
    }

    export interface Result {
        /**
         * The final configured rolls array
         */
        rolls: CosmereRoll[];

        /**
         * The configured roll options applied to all rolls (e.g. roll mode)
         */
        options: CosmereRollOptions;
    }
}

export class RollConfigurationDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            minimizable: false,
            resizable: false,
            positioned: true,
        },
        classes: ['dialog', 'roll-configuration'],
        tag: 'dialog',
        position: {
            width: 500,
        },
        actions: {
            submit: this.onSubmit,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ROLL_CONFIGURATION}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private submitted = false;

    private constructor(
        private data: RollConfigurationDialog.Data,
        private resolve: (value: RollConfigurationDialog.Result | null) => void,
    ) {
        super({
            window: {
                title: data.title,
            },
        });
    }

    /* --- Statics --- */
    public static show(data: RollConfigurationDialog.Data) {
        return new Promise<RollConfigurationDialog.Result | null>((resolve) => {
            void new this(data, resolve).render(true);
        });
    }

    /* --- Form --- */
    private static async onFormEvent(
        this: RollConfigurationDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        const rollMode = formData.get('rollMode') as RollMode;
        this.data.options.rollMode = rollMode;

        for (const skillRoll of this.data.rolls.filter(
            (r) => r instanceof CosmereSkillRoll,
        )) {
            if (skillRoll.parent !== undefined) continue;

            // Handle skill and attribute selection
            const skill = formData.get(`${skillRoll.uuid} skill`) as Skill;
            const attribute = formData.get(
                `${skillRoll.uuid} attribute`,
            ) as Attribute;

            if (
                skill !== (skillRoll.data as CosmereSkillRollData).skill ||
                attribute !== (skillRoll.data as CosmereSkillRollData).attribute
            ) {
                (skillRoll.data as CosmereSkillRollData).skill = skill;
                (skillRoll.data as CosmereSkillRollData).attribute = attribute;

                skillRoll.recalculateMod();
            }

            // Handle raise stakes checkbox
            const raiseStakes =
                formData.get(`${skillRoll.uuid} stakes`) === 'true';

            if (
                raiseStakes &&
                !(skillRoll.options as CosmereSkillRollOptions).raiseStakes
            ) {
                const data = foundry.utils.deepClone(skillRoll.data);
                data.source = this;
                data.parent = skillRoll.uuid;
                data.parts = ['1dp'];

                this.data.rolls.push(
                    new CosmerePlotRoll(data.parts.join(' + '), data, {}),
                );
            }

            if (
                !raiseStakes &&
                (skillRoll.options as CosmereSkillRollOptions).raiseStakes
            ) {
                const plotRollIndex = this.data.rolls.findIndex(
                    (r) =>
                        r instanceof CosmerePlotRoll &&
                        r.data.parent === skillRoll.uuid,
                );

                if (plotRollIndex > -1) {
                    this.data.rolls.splice(plotRollIndex, 1);
                }
            }

            (skillRoll.options as CosmereSkillRollOptions).raiseStakes =
                raiseStakes;

            // Handle temporary bonus field
            const tempBonus = formData
                .get(`${skillRoll.uuid} temp`)
                ?.valueOf() as string;

            let tempRollIndex = this.data.rolls.findIndex(
                (r) =>
                    !(r instanceof CosmerePlotRoll) &&
                    r.data.source === this &&
                    r.data.parent === skillRoll.uuid,
            );

            if (
                tempRollIndex > -1 &&
                (tempBonus === '' ||
                    this.data.rolls[tempRollIndex].formula !== tempBonus)
            ) {
                this.data.rolls.splice(tempRollIndex, 1);
                tempRollIndex = -1;
            }

            if (tempBonus !== '' && tempRollIndex < 0) {
                const data = foundry.utils.deepClone(skillRoll.data);
                data.source = this;
                data.parent = skillRoll.uuid;
                data.parts = [tempBonus];

                this.data.rolls.push(
                    new CosmereRoll(data.parts.join(' + '), data, {}),
                );
            }
        }

        const firstDamage = this.data.rolls.find(
            (r) => r instanceof CosmereDamageRoll && r.parent === undefined,
        );

        if (firstDamage) {
            const tempBonus = formData.get(`damage temp`)?.valueOf() as string;

            let tempRollIndex = this.data.rolls.findIndex(
                (r) =>
                    !(r instanceof CosmereGrazeRoll) &&
                    r.data.source === this &&
                    r.data.parent === firstDamage.uuid,
            );

            if (
                tempRollIndex > -1 &&
                (tempBonus === '' ||
                    this.data.rolls[tempRollIndex].formula !== tempBonus)
            ) {
                this.data.rolls.splice(tempRollIndex, 1);
                tempRollIndex = -1;
            }

            if (tempBonus !== '' && tempRollIndex < 0) {
                const data = foundry.utils.deepClone(
                    firstDamage.data,
                ) as CosmereDamageRollData;
                data.source = this;
                data.parent = firstDamage.uuid;
                data.parts = [tempBonus];

                this.data.rolls.push(
                    new CosmereDamageRoll(data.parts.join(' + '), data, {}),
                );
            }
        }

        const preps: Promise<CosmereRoll>[] = [];
        this.data.rolls.forEach((r) =>
            preps.push(r.prepare(this.data.options as RollEvaluationOptions)),
        );
        await Promise.all(preps);

        void this.render();
    }

    /* --- Actions --- */
    protected static onSubmit(this: RollConfigurationDialog) {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            rollMode: HTMLSelectElement;
        };

        this.resolve({
            rolls: this.data.rolls,
            options: foundry.utils.mergeObject(this.data.options, {
                rollMode: form.rollMode?.value as RollMode,
            }) as CosmereRollOptions,
        });

        this.submitted = true;
        void this.close();
    }

    /* --- Event handlers --- */

    protected async onClickConfigureDie(event: JQuery.MouseDownEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (event.which !== 1 && event.which !== 3) return;

        const target = event.currentTarget as HTMLElement;
        const uuidDie = target.dataset.uuid;
        const uuidRoll = $(target).closest('.roll-config').get(0)?.dataset.uuid;

        if (!uuidDie || !uuidRoll) return;

        const rollIndex = this.data.rolls.findIndex((r) => r.uuid === uuidRoll);

        if (rollIndex < 0) return;

        switch (event.which) {
            case 1:
                if (
                    this.data.rolls[rollIndex].dice.find(
                        (d) => d.uuid === uuidDie,
                    )?.hasDisadvantage
                ) {
                    await this.data.rolls[rollIndex].modify(
                        DieModifier.Disadvantage,
                        uuidDie,
                        true,
                    );
                }

                await this.data.rolls[rollIndex].modify(
                    DieModifier.Advantage,
                    uuidDie,
                    true,
                );
                break;
            case 3:
                if (
                    this.data.rolls[rollIndex].dice.find(
                        (d) => d.uuid === uuidDie,
                    )?.hasAdvantage
                ) {
                    await this.data.rolls[rollIndex].modify(
                        DieModifier.Advantage,
                        uuidDie,
                        true,
                    );
                }

                await this.data.rolls[rollIndex].modify(
                    DieModifier.Disadvantage,
                    uuidDie,
                    true,
                );
                break;
        }

        void this.render();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);

        $(this.element)
            .find('.dice-tooltip .dice-rolls .roll.die')
            .on('mousedown', this.onClickConfigureDie.bind(this));
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    public _prepareContext() {
        const configuredRollMode =
            this.data.options.rollMode ?? game.settings.get('core', 'rollMode');

        const skillRolls = this.data.rolls
            .filter(
                (r) => r instanceof CosmereSkillRoll && r.parent === undefined,
            )
            .map((r) => ({
                roll: r,
                plot: this.data.rolls.find(
                    (p) => p instanceof CosmerePlotRoll && p.parent === r.uuid,
                ),
                tempBonus: this.data.rolls
                    .find(
                        (b) =>
                            !(b instanceof CosmerePlotRoll) &&
                            b.data.source === this &&
                            b.parent === r.uuid,
                    )
                    ?.data.parts?.join(' + '),
                bonuses: this.data.rolls.filter(
                    (b) =>
                        !(b instanceof CosmerePlotRoll) && b.parent === r.uuid,
                ),
            }));

        const damageRolls = this.data.rolls
            .filter(
                (r) => r instanceof CosmereDamageRoll && r.parent === undefined,
            )
            .map((r) => ({
                roll: r,
                graze: this.data.rolls.find(
                    (g) => g instanceof CosmereGrazeRoll && g.parent === r.uuid,
                ),
                bonuses: this.data.rolls.filter(
                    (b) =>
                        !(b instanceof CosmereGrazeRoll) && b.parent === r.uuid,
                ),
            }));

        const otherRolls = this.data.rolls.filter(
            (r) =>
                !(r instanceof CosmereSkillRoll) &&
                !(r instanceof CosmereDamageRoll) &&
                r.parent === undefined,
        );

        return Promise.resolve({
            rollModes: CONFIG.Dice.rollModes,
            configuredRollMode,

            skillRolls,
            damageRolls,
            otherRolls,

            tempDamage: this.data.rolls
                .find(
                    (b) =>
                        b instanceof CosmereDamageRoll &&
                        b.data.source === this,
                )
                ?.data.parts?.join(' + '),

            skills: {
                ...Object.entries(CONFIG.COSMERE.skills).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            attributes: {
                ...Object.entries(CONFIG.COSMERE.attributes).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
        });
    }
}
