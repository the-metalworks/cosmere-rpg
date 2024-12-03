import { Attribute } from '@system/types/cosmere';
import { RollMode } from '@system/dice/types';
import { AdvantageMode } from '@system/types/roll';
import { AnyObject } from '@system/types/utils';

import { D20RollData } from '@system/dice/d20-roll';
import { DamageRollData } from '@system/dice/damage-roll';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

const { ApplicationV2 } = foundry.applications.api;

const DICE_PART_REGEX = /^\d+d\d+$/;
const ADVANTAGE_MODE_COLORS = {
    [AdvantageMode.Disadvantage]: 'rgb(118 43 43)',
    [AdvantageMode.Advantage]: 'rgb(49 69 118)',
    [AdvantageMode.None]: null,
};
const NONE = 'none';
type None = typeof NONE;

export namespace AttackConfigurationDialog {
    export interface Data {
        /**
         * The title of the dialog window
         */
        title: string;

        /**
         * Data about the skill test
         */
        skillTest: {
            /**
             * The formulas of the roll
             */
            parts: string[];

            /**
             * The data to be used when parsing the skill test roll
             */
            data: D20RollData;

            /**
             * What advantage modifier to apply to the d20 roll
             */
            advantageMode?: AdvantageMode;

            /**
             * What advantage modifer to apply to the plot die roll
             */
            advantageModePlot?: AdvantageMode;

            /**
             * Whether or not to include a plot die in the roll
             */
            plotDie?: boolean;

            /**
             * A dice formula stating any miscellanious other bonuses or negatives to the specific roll
             */
            temporaryModifiers?: string;
        };

        /**
         * Data about the damage roll
         */
        damageRoll: {
            /**
             * The formulas of the roll
             */
            parts: string[];

            /**
             * The data to be used when parsing the damage roll
             */
            data: DamageRollData;

            /**
             * What advantage modifier to apply to the damage roll
             */
            advantageMode?: AdvantageMode;
        };

        /**
         * The attribute that is used for the roll by default
         */
        defaultAttribute?: Attribute | None;

        /**
         * The roll mode that should be selected by default
         */
        defaultRollMode?: RollMode;
    }

    export interface Result {
        attribute: Attribute | None;
        rollMode: RollMode;
        skillTest: {
            plotDie: boolean;
            advantageMode: AdvantageMode;
            advantageModePlot: AdvantageMode;
            temporaryModifiers: string;
        };
        damageRoll: {
            advantageMode: AdvantageMode;
        };
    }
}

export class AttackConfigurationDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                minimizable: false,
                resizable: true,
                title: 'Attack Configuration',
            },
            classes: ['dialog', 'attack-configuration'],
            tag: 'dialog',
            position: {
                width: 500,
            },
            actions: {
                submit: this.onSubmit,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/roll/dialogs/attack-config.hbs',
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
    private originalFormulaSize = 0;

    private constructor(
        private data: AttackConfigurationDialog.Data,
        private resolve: (
            value: AttackConfigurationDialog.Result | null,
        ) => void,
    ) {
        super({
            window: {
                title: data.title,
            },
        });

        this.data.skillTest.parts.unshift('1d20');
        this.originalFormulaSize = this.data.skillTest.parts.length;
        this.data.skillTest.advantageMode ??= AdvantageMode.None;
        this.data.skillTest.advantageModePlot ??= AdvantageMode.None;
        this.data.damageRoll.advantageMode ??= AdvantageMode.None;
    }

    /* --- Statics --- */

    public static show(data: AttackConfigurationDialog.Data) {
        return new Promise<AttackConfigurationDialog.Result | null>(
            (resolve) => {
                void new this(data, resolve).render(true);
            },
        );
    }

    /* --- Form --- */

    private static onFormEvent(
        this: AttackConfigurationDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        const attribute = formData.get('attribute') as Attribute | None;
        const rollMode = formData.get('rollMode') as RollMode;
        const plotDie = formData.get('plotDie') === 'true';
        const tempMod = formData.get('temporaryMod')?.valueOf() as string;

        // get rid of existing temp mod formula
        if (this.data.skillTest.parts.length > this.originalFormulaSize)
            this.data.skillTest.parts.pop();
        // add the current ones in for display in the formula bar
        this.data.skillTest.parts.push(tempMod);
        // store it
        this.data.skillTest.temporaryModifiers = tempMod;

        const skill = this.data.skillTest.data.skill;
        const attributeData =
            attribute !== NONE
                ? this.data.skillTest.data.attributes[attribute]
                : { value: 0, bonus: 0 };
        const rank = skill.rank;
        const value = attributeData.value + attributeData.bonus;

        this.data.skillTest.data.mod = rank + value;
        this.data.skillTest.plotDie = plotDie;

        this.data.defaultAttribute = attribute !== NONE ? attribute : undefined;
        this.data.defaultRollMode = rollMode;

        void this.render();
    }

    /* --- Actions --- */

    protected static onSubmit(this: AttackConfigurationDialog) {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            attribute: HTMLSelectElement;
            rollMode: HTMLSelectElement;
            plotDie: HTMLInputElement;
            temporaryMod: HTMLInputElement;
        };

        const attribute = form.attribute.value as Attribute | 'none';
        const rollMode = form.rollMode.value as RollMode;

        const plotDie = form.plotDie.checked;
        const skillTestAdvantageMode =
            this.data.skillTest.advantageMode ?? AdvantageMode.None;
        const skillTestAdvantageModePlot =
            this.data.skillTest.advantageModePlot ?? AdvantageMode.None;
        const damageRollAdvantageMode =
            this.data.damageRoll.advantageMode ?? AdvantageMode.None;

        this.resolve({
            attribute,
            rollMode,
            skillTest: {
                plotDie,
                advantageMode: skillTestAdvantageMode,
                advantageModePlot: skillTestAdvantageModePlot,
                temporaryModifiers: form.temporaryMod.value,
            },
            damageRoll: {
                advantageMode: damageRollAdvantageMode,
            },
        });
        this.submitted = true;
        void this.close();
    }

    /* --- Event handlers --- */

    protected onMultiStateToggleChange(event: Event) {
        const name = $(event.target!).attr('name')!;
        const value = $(event.target!).attr('value')!;

        const obj = foundry.utils.expandObject({ [name]: value });

        // Apply
        this.data = foundry.utils.mergeObject(this.data, obj);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);

        $(this.element).prop('open', true);
        $(this.element)
            .find('app-multi-state-toggle')
            .on('change', this.onMultiStateToggleChange.bind(this));
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    protected _prepareContext() {
        const skillTestFormula = foundry.dice.Roll.replaceFormulaData(
            this.data.skillTest.parts
                .join(' + ')
                .replace(/\+ -/g, '-')
                .replace(/\+ \+/g, '+'),
            this.data.skillTest.data,
            {
                missing: '0',
            },
        );

        const damageRollFormula = foundry.dice.Roll.replaceFormulaData(
            this.data.damageRoll.parts
                .join(' + ')
                .replace(/\+ -/g, '-')
                .replace(/\+ \+/g, '+'),
            this.data.damageRoll.data,
            {
                missing: '0',
            },
        );

        return Promise.resolve({
            skillTest: {
                dice: this.data.skillTest.parts.find((part) =>
                    DICE_PART_REGEX.test(part),
                )!,
                formula: skillTestFormula,
                plotDie: this.data.skillTest.plotDie,
                advantageMode: this.data.skillTest.advantageMode,
                advantageModePlot: this.data.skillTest.advantageModePlot,
                temporaryModifiers: this.data.skillTest.temporaryModifiers,
            },
            damageRoll: {
                dice: this.data.damageRoll.parts.find((part) =>
                    DICE_PART_REGEX.test(part),
                ),
                formula: damageRollFormula,
                advantageMode: this.data.damageRoll.advantageMode,
            },

            defaultRollMode: this.data.defaultRollMode,
            defaultAttribute: this.data.defaultAttribute,

            rollModes: CONFIG.Dice.rollModes,
            advantageModes: Object.entries(
                CONFIG.COSMERE.dice.advantageModes,
            ).reduce(
                (acc, [key, label]) => ({
                    ...acc,
                    [key]: {
                        label: label,
                        color: ADVANTAGE_MODE_COLORS[key as AdvantageMode],
                    },
                }),
                {},
            ),
            attributes: {
                none: 'GENERIC.None',
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
