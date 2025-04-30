import { MovementType } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureMovementRateDialog extends HandlebarsApplicationMixin(
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
            classes: ['dialog', 'configure-movement-rate'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                'update-movement': this.onUpdateMovementRate,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_MOVEMENT}`,
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

    private movementData: CommonActorData['movement'];

    private constructor(private actor: CosmereActor) {
        super({
            id: `${actor.uuid}.MovementRate`,
            window: {
                title: game
                    .i18n!.localize('DIALOG.ConfigureMovementRate.Title')
                    .replace('{actor}', actor.name),
            },
        });

        this.movementData = this.actor.system.movement;

        (Object.keys(CONFIG.COSMERE.movement.types) as MovementType[]).forEach(
            (type) => {
                this.movementData[type].rate.override ??=
                    this.movementData[type].rate.value ?? 0;
            },
        );
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor) {
        await new ConfigureMovementRateDialog(actor).render(true);
    }

    /* --- Actions --- */

    private static onUpdateMovementRate(this: ConfigureMovementRateDialog) {
        void this.actor.update({
            'system.movement': this.movementData,
        });
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureMovementRateDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        // Get event target
        const target = event.target as HTMLInputElement;

        (Object.keys(CONFIG.COSMERE.movement.types) as MovementType[]).forEach(
            (type) => {
                // Get mode
                const mode = (formData.get(`${type}.mode`) ??
                    Derived.Mode.Override) as Derived.Mode;

                // Assign mode
                this.movementData[type].rate.mode = mode;

                // Assign rate
                if (
                    mode === Derived.Mode.Override &&
                    target.name === `${type}.value`
                ) {
                    this.movementData[type].rate.override = parseInt(
                        formData.get(`${type}.value`) as string,
                    );
                }
            },
        );

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
        const movementRates = (
            Object.keys(CONFIG.COSMERE.movement.types) as MovementType[]
        ).map((type) => ({
            rate: this.movementData[type].rate,
            mode: this.movementData[type].rate.mode,
            type,
            label: CONFIG.COSMERE.movement.types[type].label,
        }));

        return Promise.resolve({
            actor: this.actor,
            modes: Derived.Modes,
            movementRates,
        });
    }
}
