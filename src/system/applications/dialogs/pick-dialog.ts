import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

export namespace PickDialog {
    export interface Option {
        id: string;
        label: string;
    }

    export interface Data {
        /**
         * The title of the dialog
         */
        title: string;

        /**
         * The options to pick from
         */
        options: Option[];

        /**
         * Whether to localize the option labels
         */
        localize?: boolean;
    }
}

export class PickDialog extends ComponentHandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2<AnyObject>,
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
                title: 'DIALOG.PickDialog.Title',
            },
            classes: ['dialog', 'pick-dialog'],
            tag: 'dialog',
            position: {
                width: 300,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_PICK}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private submitted = false;

    private constructor(
        private data: PickDialog.Data,
        private resolve: (value: string | null) => void,
    ) {
        super({
            window: {
                title: data.title,
            },
        });
    }

    /* --- Statics --- */

    public static show(data: PickDialog.Data): Promise<string | null> {
        return new Promise((resolve) => {
            const dialog = new this(data, resolve);
            void dialog.render(true);
        });
    }

    /* --- Actions --- */

    private static onFormEvent(
        this: PickDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (!(event instanceof SubmitEvent)) return;

        // Get choice
        const choice = formData.get('choice') as string | undefined;

        // Resolve with choice
        this.resolve(choice ?? null);

        // Mark as submitted
        this.submitted = true;

        // Close dialog
        void this.close();
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            ...this.data,
        });
    }
}
