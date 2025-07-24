import { Resource } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureResourceDialog extends HandlebarsApplicationMixin(
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
            classes: ['dialog', 'configure-resource'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                'update-resource': this.onUpdateResource,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_RESOURCE}`,
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
                title: game
                    .i18n!.localize('DIALOG.ConfigureResource.Title')
                    .replace(
                        '{resource}',
                        game.i18n!.localize(
                            CONFIG.COSMERE.resources[resourceId].label,
                        ),
                    )
                    .replace('{actor}', actor.name),
            },
        });

        this.resourceData = (
            this.actor.system.schema.getField(
                `resources.${resourceId}`,
            ) as foundry.data.fields.SchemaField
        ).initialize(
            foundry.utils.deepClone(this.actor.system.resources[resourceId]),
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

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    protected _prepareContext() {
        // Get config
        const config = CONFIG.COSMERE.resources[this.resourceId];

        return Promise.resolve({
            actor: this.actor,
            mode: this.mode,
            modes: Derived.Modes,
            ...this.resourceData,
            formula: config.formula,
        });
    }
}
