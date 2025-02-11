import { CharacterActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import {
    CharacterActorData,
    RECOVERY_DICE,
} from '@system/data/actor/character';
import { Derived } from '@system/data/fields';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureRecoveryDieDialog extends HandlebarsApplicationMixin(
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
            classes: ['dialog', 'configure-recovery-die'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                'update-recovery': this.onUpdateRecoveryDie,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_RECOVERY}`,
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

    private recoveryData: CharacterActorData['recovery'];
    private mode: Derived.Mode;

    private constructor(private actor: CharacterActor) {
        super({
            id: `${actor.uuid}.RecoveryDie`,
            window: {
                title: game
                    .i18n!.localize('DIALOG.ConfigureRecoveryDie.Title')
                    .replace('{actor}', actor.name),
            },
        });

        this.recoveryData = this.actor.system.recovery;
        this.recoveryData.die.override ??=
            this.recoveryData.die.value ?? RECOVERY_DICE[0];
        this.mode = this.recoveryData.die.mode;
    }

    /* --- Statics --- */

    public static async show(actor: CharacterActor) {
        await new ConfigureRecoveryDieDialog(actor).render(true);
    }

    /* --- Actions --- */

    private static onUpdateRecoveryDie(this: ConfigureRecoveryDieDialog) {
        void this.actor.update({
            'system.recovery': this.recoveryData,
        });
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureRecoveryDieDialog,
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
        this.recoveryData.die.mode = this.mode;

        // Assign rate
        if (this.mode === Derived.Mode.Override && target.name === 'die')
            this.recoveryData.die.override = formData.object.die as string;

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
            actor: this.actor,
            mode: this.mode,
            modes: Derived.Modes,
            ...this.recoveryData,
            value: this.recoveryData.die.value,
            recoveryDice: RECOVERY_DICE.reduce(
                (dice, die) => ({
                    ...dice,
                    [die]: die,
                }),
                {} as Record<string, string>,
            ),
            override: this.recoveryData.die.override,
        });
    }
}
