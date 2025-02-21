import { AttributeGroup } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureDeflectDialog extends HandlebarsApplicationMixin(
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
            classes: ['dialog', 'configure-deflect'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                'update-deflect': this.onUpdateDeflect,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_DEFLECT}`,
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

    private data: CommonActorData['deflect'];
    private mode: Derived.Mode;

    private constructor(private actor: CosmereActor) {
        super({
            id: `${actor.uuid}.Deflect`,
            window: {
                title: game.i18n!.format('DIALOG.ConfigureDeflect.Title', {
                    actor: actor.name,
                }),
            },
        });

        this.data = actor.system.deflect;
        this.data.natural ??= 0;
        this.data.override ??= this.data.value ?? 0;
        this.data.bonus ??= 0;
        this.mode = this.data.mode;
    }

    /* --- Statics --- */

    public static show(actor: CosmereActor) {
        void new ConfigureDeflectDialog(actor).render(true);
    }

    /* --- Actions --- */

    private static onUpdateDeflect(this: ConfigureDeflectDialog) {
        void this.actor.update({
            'system.deflect': this.data,
        });
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureDeflectDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        const target = event.target as HTMLInputElement;

        this.mode = formData.get('mode') as Derived.Mode;

        if (target.name !== 'mode') {
            if (this.mode === Derived.Mode.Override) {
                this.data.override = Number(formData.object.value ?? 0);
            } else {
                this.data.natural = Number(formData.object.natural ?? 0);
                this.data.bonus = Number(formData.object.bonus ?? 0);
            }
        }

        if (isNaN(this.data.override!)) this.data.override = 0;
        if (isNaN(this.data.natural!)) this.data.natural = 0;
        if (isNaN(this.data.bonus)) this.data.bonus = 0;

        // Assign mode
        this.data.mode = this.mode;

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
        return Promise.resolve({
            ...this.data,
            mode: this.mode,
            modes: {
                ...Derived.Modes,
                [Derived.Mode.Derived]: 'TYPES.Item.armor',
            },
        });
    }
}
