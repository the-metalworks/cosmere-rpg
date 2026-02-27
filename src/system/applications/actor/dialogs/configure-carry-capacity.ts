import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureCarryCapacityDialog extends HandlebarsApplicationMixin(
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
        classes: ['dialog', 'configure-carry-capacity'],
        tag: 'dialog',
        position: {
            width: 350,
        },
        actions: {
            'update-carry': this.onUpdateCarryCapacity,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_CARRY}`,
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

    private encumbranceData: CommonActorData['encumbrance'];
    private mode: Derived.Mode;

    private constructor(private actor: CosmereActor) {
        super({
            id: `${actor.uuid}.CarryCapacity`,
            window: {
                title: game.i18n
                    .localize('DIALOG.ConfigureCarryCapacity.Title')
                    .replace('{actor}', actor.name),
            },
        });

        this.encumbranceData = this.actor.system.encumbrance;
        this.encumbranceData.carry.override ??=
            this.encumbranceData.carry.value ?? 0;
        this.mode = this.encumbranceData.carry.mode;
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor) {
        await new ConfigureCarryCapacityDialog(actor).render(true);
    }

    /* --- Actions --- */

    private static onUpdateCarryCapacity(this: ConfigureCarryCapacityDialog) {
        void this.actor.update({
            system: {
                encumbrance: this.encumbranceData,
            },
        });
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureCarryCapacityDialog,
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
        this.encumbranceData.carry.mode = this.mode;

        // Assign range
        if (this.mode === Derived.Mode.Override && target.name === 'range')
            this.encumbranceData.carry.override = formData.object
                .range as number;

        // Assign obscured affected
        if (
            this.mode === Derived.Mode.Override &&
            target.name === 'ignoreObscure'
        ) {
            this.encumbranceData.carry.override = formData.object.ignoreObscure
                ? Number.MAX_VALUE
                : 0;
        }

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            actor: this.actor,
            mode: this.mode,
            modes: Derived.Modes,
            ...this.encumbranceData,
        });
    }
}
