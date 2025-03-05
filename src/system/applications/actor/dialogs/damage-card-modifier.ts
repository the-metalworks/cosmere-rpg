import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_CHAT_MODIFY_DAMAGE}`;

interface DamageModifierDialogOptions {
    /**
     * Whether this is healing.
     */
    isHealing: boolean;

    /**
     * Who is tending to this actor?
     */
    action: string;
}

export class DamageModifierDialog extends foundry.applications.api.DialogV2 {
    private constructor(
        private isHealing: boolean,
        private action: string,
        private resolve: (modifier: number) => void,
        content: string,
    ) {
        super({
            window: {
                title: `COSMERE.ChatMessage.ModifierDialog.${action === 'reduce-focus' ? 'FocusTitle' : isHealing ? 'HealingTitle' : 'DamageTitle'}`,
            },
            content,
            buttons: [
                {
                    label: 'GENERIC.Button.Confirm',
                    action: 'submit',
                    default: true,
                    // NOTE: Callback must be async
                    // eslint-disable-next-line @typescript-eslint/require-await
                    callback: async () => this.onContinue(),
                },
            ],
        });
    }

    /* --- Statics --- */

    public static async show(
        options: DamageModifierDialogOptions = {
            isHealing: false,
            action: '',
        },
    ): Promise<number> {
        // Render dialog inner HTML
        const content = await renderTemplate(TEMPLATE, {
            isHealing: options.isHealing,
            action: options.action,
        });

        // Render dialog and wrap as promise
        return new Promise((resolve) => {
            void new DamageModifierDialog(
                options.isHealing,
                options.action,
                resolve,
                content,
            ).render(true);
        });
    }

    /* --- Actions --- */

    private onContinue() {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            modifier: HTMLInputElement;
        };

        // Resolve
        this.resolve(form.modifier.value ? form.modifier.valueAsNumber : 0);
    }
}
