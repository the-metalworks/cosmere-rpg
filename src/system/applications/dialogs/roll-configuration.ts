import { Attribute } from '@system/types/cosmere';
import { RollMode } from '@system/dice/types';
import { AdvantageMode } from '@system/types/roll';
import { AnyObject, NONE, Nullable } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import {
    toggleAdvantageMode,
    getFormulaDisplayString,
    getNullableFromFormInput,
} from '@src/system/utils/generic';
import { D20RollData } from '@system/dice/d20-roll';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

const { ApplicationV2 } = foundry.applications.api;

export namespace RollConfigurationDialog {
    export interface Data {
        /**
         * The title of the dialog window
         */
        title: string;

        /**
         * The attribute that is used for the roll by default
         */
        defaultAttribute?: Nullable<Attribute>;

        /**
         * The roll mode that should be selected by default
         */
        defaultRollMode?: RollMode;

        /**
         * A dice formula stating any miscellaneous other bonuses or negatives to the specific roll
         */
        temporaryModifiers?: string;

        /**
         * Whether or not to include a plot die in the test
         */
        raiseStakes?: boolean;

        /**
         * Data about the skill test
         */
        skillTest: {
            /**
             * The formula parts of the roll
             */
            parts: string[];

            /**
             * The data to be used when parsing the roll
             */
            data: D20RollData;

            /**
             * The roll formula parsed from the roll parts.
             */
            formula?: string;

            /**
             * What advantage modifier to apply to the skill test roll
             */
            advantageMode?: AdvantageMode;
        };

        /**
         * Data about the plot die
         */
        plotDie: {
            /**
             * What advantage modifer to apply to the plot die roll
             */
            advantageMode?: AdvantageMode;
        };
    }

    export interface Result {
        attribute: Nullable<Attribute>;
        rollMode: RollMode;
        plotDie: boolean;
        advantageMode: AdvantageMode;
        advantageModePlot: AdvantageMode;
        temporaryModifiers: string;
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
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
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
        },
    );

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
    private originalFormulaSize = 0;

    private constructor(
        private data: RollConfigurationDialog.Data,
        private resolve: (value: RollConfigurationDialog.Result | null) => void,
    ) {
        super({
            window: {
                title: data.title,
            },
        });

        this.originalFormulaSize = this.data.skillTest.parts.length;

        this.data.skillTest.advantageMode ??= AdvantageMode.None;
        this.data.plotDie.advantageMode ??= AdvantageMode.None;

        this.data.skillTest.formula = foundry.dice.Roll.replaceFormulaData(
            getFormulaDisplayString(this.data.skillTest.parts),
            this.data.skillTest.data,
            {
                missing: '0',
            },
        );
    }

    /* --- Statics --- */

    public static show(data: RollConfigurationDialog.Data) {
        return new Promise<RollConfigurationDialog.Result | null>((resolve) => {
            void new this(data, resolve).render(true);
        });
    }

    /* --- Form --- */

    private static onFormEvent(
        this: RollConfigurationDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        const attribute = getNullableFromFormInput<Attribute>(
            formData.get('attribute') as string,
        );
        const rollMode = formData.get('rollMode') as RollMode;
        const raiseStakes = formData.get('raiseStakes') === 'true';
        const tempMod = formData.get('temporaryMod')?.valueOf() as string;

        // get rid of existing temp mod formula
        if (this.data.skillTest.parts.length > this.originalFormulaSize)
            this.data.skillTest.parts.pop();
        // add the current ones in for display in the formula bar
        this.data.skillTest.parts.push(tempMod);
        // store it
        this.data.temporaryModifiers = tempMod;

        const skill = this.data.skillTest.data.skill;
        const attributeData = attribute
            ? this.data.skillTest.data.attributes[attribute]
            : { value: 0, bonus: 0 };
        const rank = skill.rank;
        const value = attributeData.value + attributeData.bonus;

        this.data.skillTest.data.mod = rank + value;
        this.data.defaultAttribute = attribute ?? undefined;
        this.data.defaultRollMode = rollMode;
        this.data.raiseStakes = raiseStakes;

        void this.render();
    }

    /* --- Actions --- */

    protected static onSubmit(this: RollConfigurationDialog) {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            attribute: HTMLSelectElement;
            rollMode: HTMLSelectElement;
            raiseStakes: HTMLInputElement;
            temporaryMod: HTMLInputElement;
        };

        this.resolve({
            attribute: getNullableFromFormInput<Attribute>(
                form.attribute.value,
            ),
            rollMode: form.rollMode.value as RollMode,
            temporaryModifiers: form.temporaryMod.value,
            plotDie: form.raiseStakes.checked,
            advantageMode:
                this.data.skillTest.advantageMode ?? AdvantageMode.None,
            advantageModePlot:
                this.data.plotDie.advantageMode ?? AdvantageMode.None,
        });

        this.submitted = true;
        void this.close();
    }

    /* --- Event handlers --- */

    protected onClickConfigureDie(event: JQuery.MouseDownEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (event.which !== 1 && event.which !== 3) return;

        const target = event.currentTarget as HTMLElement;
        const action = target.dataset.action;

        target.classList.remove(AdvantageMode.Advantage);
        target.classList.remove(AdvantageMode.Disadvantage);
        target.classList.remove(AdvantageMode.None);

        switch (action) {
            case 'skill-adv-mode':
                this.data.skillTest.advantageMode = toggleAdvantageMode(
                    this.data.skillTest.advantageMode ?? AdvantageMode.None,
                    event.which === 1,
                );
                target.classList.add(this.data.skillTest.advantageMode);
                break;
            case 'plot-adv-mode':
                this.data.plotDie.advantageMode = toggleAdvantageMode(
                    this.data.plotDie.advantageMode ?? AdvantageMode.None,
                    event.which === 1,
                );
                target.classList.add(this.data.plotDie.advantageMode);
                break;
            default:
                break;
        }
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);

        $(this.element).prop('open', true);

        $(this.element)
            .find('.roll-config.test .dice-tooltip .dice-rolls .roll.die')
            .addClass(this.data.skillTest.advantageMode ?? AdvantageMode.None);

        $(this.element)
            .find('.roll-config.plot .dice-tooltip .dice-rolls .roll.die')
            .addClass(this.data.plotDie.advantageMode ?? AdvantageMode.None);

        $(this.element)
            .find('.dice-tooltip .dice-rolls .roll.die')
            .on('mousedown', this.onClickConfigureDie.bind(this));
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: this.data.defaultRollMode,
            attributes: {
                [NONE]: 'GENERIC.None',
                ...Object.entries(CONFIG.COSMERE.attributes).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            },
            defaultAttribute: this.data.defaultAttribute,
            temporaryModifiers: this.data.temporaryModifiers,
            skillTest: this.data.skillTest.formula
                ? {
                      formula: this.data.skillTest.formula,
                      dice: new foundry.dice.Roll(this.data.skillTest.formula)
                          .dice,
                  }
                : undefined,
            plotDie: this.data.raiseStakes
                ? {
                      formula: '1dp',
                      dice: new foundry.dice.Roll('1dp').dice,
                  }
                : undefined,
        });
    }
}
