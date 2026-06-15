import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

interface RenameDirectoryEntryDialogData {
    /**
     * The type of Document in the Directory.
     */
    documentType: string;

    /**
     * The original name of the entry
     */
    originalName: string;
}

const NOT_FOUND_NAME = 'Current Name Not Passed';
const DEFAULT_DOCUMENT_TYPE = 'Entry';

export class RenameDirectoryEntryDialog extends ComponentHandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            minimizable: false,
            resizable: true,
        },
        position: {
            width: 300,
        },
        tag: 'dialog',
        classes: ['cosmere', 'dialog', 'rename-directory-entry'],
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_DIRECTORY_ENTRY_RENAME}`,
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
        private data: RenameDirectoryEntryDialogData = {
            documentType: DEFAULT_DOCUMENT_TYPE,
            originalName: NOT_FOUND_NAME,
        },
        private resolve: (value: string | null) => void,
    ) {
        super({
            window: {
                title: game.i18n.format('DIALOG.RenameDirectoryEntry.Title', {
                    type: data.documentType,
                }),
            },
        });
    }

    /* --- Statics --- */

    static async show(
        data: RenameDirectoryEntryDialogData = {
            documentType: DEFAULT_DOCUMENT_TYPE,
            originalName: NOT_FOUND_NAME,
        },
    ): Promise<string | null> {
        return new Promise((resolve) => {
            const dialog = new this(data, resolve);
            void dialog.render(true);
        });
    }

    /* --- Actions --- */

    private static onFormEvent(
        this: RenameDirectoryEntryDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (!(event instanceof SubmitEvent)) return;
        const newName = formData.get('name')?.toString().trim() ?? null;

        this.resolve(newName);

        this.submitted = true;

        void this.close();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        if (!this.submitted) this.resolve(null);
    }

    /* --- Context --- */

    public _prepareContext() {
        return Promise.resolve({
            ...this.data,
        });
    }
}
