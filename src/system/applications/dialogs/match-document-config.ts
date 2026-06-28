import type { AnyObject } from '@system/types/utils';

// Data
import { MatchDocumentDataModel } from '@system/data/fields/match-document-field';

// Utils
import { matchDocuments, MatchBy } from '@system/utils/match-document';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

export class MatchDocumentConfigDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            title: 'DIALOG.MatchDocumentConfig.Title',
            minimizable: false,
            resizable: false,
            positioned: true,
        },
        classes: ['dialog', 'match-document-config'],
        tag: 'dialog',
        position: {
            width: 450,
        },
        actions: {
            submit: this.onSubmit,
            'add-step': this.onAddStep,
            'remove-step': this.onRemoveStep,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_MATCH_DOCUMENT_CONFIG}`,
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

    private hasResolved = false;

    private constructor(
        protected data: MatchDocumentDataModel,
        protected relativeTo: foundry.abstract.Document.Any | undefined,
        protected expectedDocumentType:
            | foundry.abstract.Document.Type
            | undefined,
        private resolve: (result: MatchDocumentDataModel | null) => void,
    ) {
        super({
            id: `MatchDocumentConfig.${foundry.utils.randomID()}`,
        });
    }

    public static show(
        data: MatchDocumentDataModel,
        options?: MatchDocumentConfigDialog.Options,
    ): Promise<MatchDocumentDataModel | null> {
        return new Promise((resolve) => {
            void new this(
                data.clone(),
                options?.relativeTo,
                options?.type,
                resolve,
            ).render(true);
        });
    }

    /* --- Actions --- */

    private static onSubmit(this: MatchDocumentConfigDialog) {
        this.resolve(this.data);
        this.hasResolved = true;
        void this.close();
    }

    private static onAddStep(this: MatchDocumentConfigDialog) {
        this.data.updateSource({
            steps: [...this.data.steps, {}],
        });

        void this.render();
    }

    private static onRemoveStep(this: MatchDocumentConfigDialog, event: Event) {
        if (!(event.target instanceof HTMLElement)) return;

        const indexStr = event.target
            .closest('[data-index]')
            ?.getAttribute('data-index');
        if (!indexStr) return;

        const index = parseInt(indexStr);
        if (index < 0 || index >= this.data.steps.length) return;

        this.data.steps.splice(index, 1);
        this.data.updateSource({
            steps: this.data.steps,
        });

        void this.render();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: MatchDocumentConfigDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        // Ignore submit events
        if (event instanceof SubmitEvent) return;

        event.preventDefault();

        this.data.updateSource(formData.object);

        void this.render();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        super._onClose();

        if (this.hasResolved) return;

        this.resolve(null);
        this.hasResolved = true;
    }

    /* --- Context --- */

    public async _prepareContext() {
        // Resolve step matches
        const matchesPerStep: foundry.abstract.Document.Any[][] = [];

        if (this.relativeTo) {
            let stepRelativeTo = [this.relativeTo];
            for (const step of this.data.steps) {
                try {
                    const matches = (
                        await Promise.all(
                            stepRelativeTo.map((doc) =>
                                matchDocuments({
                                    relativeTo: doc,
                                    ...step,
                                }),
                            ),
                        )
                    ).flat();

                    matchesPerStep.push(matches);
                    stepRelativeTo = matches;
                } catch (err) {
                    console.warn(
                        'Encountered an error while resolving document matches',
                        err,
                    );

                    matchesPerStep.push([]);
                    stepRelativeTo = [];
                }
            }
        }

        let lastStepType: foundry.abstract.Document.Type | null | undefined;
        let hasTypeMismatch = false;

        if (this.data.steps.length > 0) {
            const lastStep = this.data.steps[this.data.steps.length - 1];
            const lastStepMatch = this.relativeTo
                ? matchesPerStep[this.data.steps.length - 1].find(() => true)
                : undefined;

            // Best guess step resolved document type
            lastStepType =
                lastStepMatch?.documentName ??
                (lastStep.matchBy === MatchBy.DocumentType
                    ? lastStep.documentType
                    : lastStep.reference
                      ? ((await fromUuid(lastStep.reference))
                            ?.documentName as foundry.abstract.Document.Type)
                      : undefined);

            hasTypeMismatch =
                !!this.expectedDocumentType &&
                !!lastStepType &&
                lastStepType !== this.expectedDocumentType;
        }

        return Promise.resolve({
            data: this.data,
            relativeTo: this.relativeTo,
            matchesPerStep,
            lastStepType,
            hasTypeMismatch,
            expectedDocumentType: this.expectedDocumentType,
        });
    }
}

export namespace MatchDocumentConfigDialog {
    export interface Options {
        relativeTo?: foundry.abstract.Document.Any;
        type?: foundry.abstract.Document.Type;
    }
}
