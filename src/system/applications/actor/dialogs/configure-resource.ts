import { Resource } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function isHealthResourceData(
    resourceId: Resource,
    resourceData: CommonActorData['resources'][keyof CommonActorData['resources']],
): resourceData is CommonActorData['resources'][Resource.Health] {
    return resourceId === Resource.Health;
}

export class ConfigureResourceDialog extends HandlebarsApplicationMixin(
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
            positioned: true,
        },
        classes: ['dialog', 'configure-resource'],
        tag: 'dialog',
        position: {
            width: 350,
        },
        actions: {
            'update-resource': this.onUpdateResource,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.DIALOG_ACTOR_CONFIGURE_RESOURCE}`,
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

    private resourceData: CommonActorData['resources'][keyof CommonActorData['resources']];
    private mode: Derived.Mode;

    private constructor(
        private actor: CosmereActor,
        private resourceId: Resource,
    ) {
        super({
            id: `${actor.uuid}.Resource.${resourceId}`,
            window: {
                title: game.i18n
                    .localize('DIALOG.ConfigureResource.Title')
                    .replace(
                        '{resource}',
                        game.i18n.localize(
                            CONFIG.COSMERE.resources[resourceId].label,
                        ),
                    )
                    .replace('{actor}', actor.name),
            },
        });

        this.resourceData = this.actor.system.schema
            .getField(`resources.${resourceId}`)!
            .initialize(
                foundry.utils.deepClone(
                    this.actor.system.resources[resourceId],
                ),
                this.actor,
            ) as CommonActorData['resources'][keyof CommonActorData['resources']];
        this.resourceData.max.override ??= this.resourceData.max.value ?? 0;
        this.mode = this.resourceData.max.mode;
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor, resource: Resource) {
        await new ConfigureResourceDialog(actor, resource).render(true);
    }

    /* --- Actions --- */

    private static onUpdateResource(this: ConfigureResourceDialog) {
        void this.actor.update({
            [`system.resources.${this.resourceId}`]: {
                max: {
                    useOverride: this.resourceData.max.useOverride,
                    override: this.resourceData.max.override,
                },
            },
        });
        if (isHealthResourceData(this.resourceId, this.resourceData)) {
            void this.actor.update({
                [`system.resources.${this.resourceId}`]: {
                    max: {
                        range: {
                            minRange: this.resourceData.max.range.minRange,
                            maxRange: this.resourceData.max.range.maxRange,
                            average: this.resourceData.max.range.average,
                            value: this.resourceData.max.range.value,
                        },
                        useRange: this.resourceData.max.useRange,
                    },
                },
            });
        }
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureResourceDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        // Get event target
        const target = event.target as HTMLInputElement;

        // Get mode
        this.mode = formData.object.mode as Derived.Mode;

        // Assign mode
        this.resourceData.max.mode = this.mode;

        // Assign rate
        if (this.mode === Derived.Mode.Override && target.name === 'max')
            this.resourceData.max.override = formData.object.max as number;

        if (
            isHealthResourceData(this.resourceId, this.resourceData) &&
            this.mode === 'range'
        ) {
            if (target.name === 'maxRange')
                this.resourceData.max.range.maxRange = formData.object
                    .maxRange as number;
            if (target.name === 'minRange')
                this.resourceData.max.range.minRange = formData.object
                    .minRange as number;

            if (target.name === 'maxHealth')
                this.resourceData.max.range.value = formData.object
                    .maxHealth as number;
            else this.resourceData.max.range.value = this.calculateAverage();

            const maxElement = target
                .closest('form')
                ?.querySelector('[name="max"]');
            const maxValue = this.resourceData.max.range.value;
            if (maxValue && maxElement) {
                maxElement.textContent = maxValue.toString();
            }
        }

        // Render
        void this.render(true);
    }

    /* --- Functions --- */

    private calculateAverage(): number {
        if (!isHealthResourceData(this.resourceId, this.resourceData)) return 0;
        const range = this.resourceData.max.range;

        // Get ranges, if they dont exist set them as 0.
        range.minRange = range.minRange ?? 0;
        range.maxRange = range.maxRange ?? 0;

        // Constrain max range min to minRange
        if (range.maxRange < range.minRange) range.maxRange = range.minRange;

        // Calculate average
        range.average = Math.ceil((range.minRange + range.maxRange) * 0.5);

        // Return average
        return range.average;
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);

        const slider = this.element.querySelector<HTMLInputElement>(
            'input[name="maxHealth"]',
        );

        const valueDisplay =
            this.element.querySelector<HTMLInputElement>('.range-value');

        const updateSliderDisplay = () => {
            if (!slider || !valueDisplay) return;

            const value = Number(slider.value);
            const min = Number(slider.min);
            const max = Number(slider.max);

            const percentage = (value - min) / (max - min);

            const knobWidth = 12;
            const usableWidth = slider.clientWidth - knobWidth;

            const position = knobWidth / 2 + percentage * usableWidth;

            valueDisplay.textContent = slider.value;
            valueDisplay.style.left = `${position}px`;
        };

        slider?.addEventListener('input', updateSliderDisplay);

        requestAnimationFrame(updateSliderDisplay);
    }

    /* --- Context --- */

    protected _prepareContext() {
        // Get config
        const config = CONFIG.COSMERE.resources[this.resourceId];

        type CharacterModes = typeof Derived.Modes;
        type AdversaryModes = Omit<
            typeof Derived.Modes,
            Derived.Mode.Derived
        > & {
            range?: string;
        };

        let modes: CharacterModes | AdversaryModes = Derived.Modes;

        // Set the available modes for adversaries
        if (this.actor.isAdversary()) {
            const { derived, ...adversaryModes } = Derived.Modes;

            modes = {
                ...(this.resourceId === Resource.Health
                    ? { range: 'GENERIC.DerivedValue.Mode.Range' }
                    : {}),
                ...adversaryModes,
            };
        }

        return Promise.resolve({
            actor: this.actor,
            mode: this.mode,
            modes,
            ...this.resourceData,
            formula: config.formula,
        });
    }
}
