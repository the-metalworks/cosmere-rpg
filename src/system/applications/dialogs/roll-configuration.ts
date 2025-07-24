import { Attribute } from '@system/types/cosmere';
import { RollMode } from '@system/dice/types';
import { AdvantageMode } from '@system/types/roll';
import { AnyObject } from '@system/types/utils';

import { D20RollData } from '@system/dice/d20-roll';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

const { ApplicationV2 } = foundry.applications.api;

const DICE_PART_REGEX = /^\d+d\d+$/;
const ADVANTAGE_MODE_COLORS = {
    [AdvantageMode.Disadvantage]: 'rgb(118 43 43)',
    [AdvantageMode.Advantage]: 'rgb(49 69 118)',
    [AdvantageMode.None]: null,
};

export namespace RollConfigurationDialog {
    export interface Data {
        /**
         * The title of the dialog window
         */
        title: string;

        /**
         * The formulas of the roll
         */
        parts: string[];

        /**
         * The data to be used when parsing the roll
         */
        data: D20RollData;

        /**
         * Whether or not to include a plot die in the roll
         */
        plotDie?: boolean;

        /**
         * The attribute that is used for the roll by default
         */
        defaultAttribute?: Attribute;

        /**
         * The roll mode that should be selected by default
         */
        defaultRollMode?: RollMode;

        /**
         * What advantage modifier to apply to the d20 roll
         */
        advantageMode?: AdvantageMode;

        /**
         * What advantage modifer to apply to the plot die roll
         */
        advantageModePlot?: AdvantageMode;
    }

    export interface Result {
        attribute: Attribute;
        rollMode: RollMode;
        plotDie: boolean;
        advantageMode: AdvantageMode;
        advantageModePlot: AdvantageMode;
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
                template:
                    'systems/cosmere-rpg/templates/roll/dialogs/d20-config.hbs',
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

        this.data.advantageMode ??= AdvantageMode.None;
        this.data.advantageModePlot ??= AdvantageMode.None;
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

        const attribute = formData.get('attribute') as Attribute;
        const rollMode = formData.get('rollMode') as RollMode;
        const plotDie = formData.get('plotDie') === 'true';

        const skill = this.data.data.skill;
        const attributeData = this.data.data.attributes[attribute];
        const rank = skill.rank;
        const value = attributeData.value + attributeData.bonus;

        this.data.data.mod = rank + value;
        this.data.defaultAttribute = attribute;
        this.data.defaultRollMode = rollMode;
        this.data.plotDie = plotDie;

        void this.render();
    }

    /* --- Actions --- */

    protected static onSubmit(this: RollConfigurationDialog) {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            attribute: HTMLSelectElement;
            rollMode: HTMLSelectElement;
            plotDie: HTMLInputElement;
        };

        const attribute = form.attribute.value as Attribute;
        const rollMode = form.rollMode.value as RollMode;
        const plotDie = form.plotDie.checked;

        const advantageMode = this.data.advantageMode ?? AdvantageMode.None;
        const advantageModePlot =
            this.data.advantageModePlot ?? AdvantageMode.None;

        this.resolve({
            attribute,
            rollMode,
            plotDie,
            advantageMode,
            advantageModePlot,
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
        const formula = foundry.dice.Roll.replaceFormulaData(
            this.data.parts.join(' + '),
            this.data.data,
            {
                missing: '0',
            },
        );

        return Promise.resolve({
            formula,
            dice: this.data.parts.find((part) => DICE_PART_REGEX.test(part))!,
            defaultRollMode: this.data.defaultRollMode,
            defaultAttribute: this.data.defaultAttribute,
            plotDie: this.data.plotDie,
            advantageMode: this.data.advantageMode,
            advantageModePlot: this.data.advantageModePlot,

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
            attributes: Object.entries(CONFIG.COSMERE.attributes).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
        });
    }
}
