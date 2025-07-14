import { ExpertiseType } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject, CosmereDocument } from '@system/types/utils';

import {
    Expertise,
    ExpertisesField,
} from '@system/data/actor/fields/expertises-field';

// Utils
import { containsExpertise } from '@system/utils/actor';
import { cloneCollection, getObjectChanges } from '@system/utils/data';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface EditExpertisesDialogCommonConfig {
    /**
     * The title of the dialog.
     * If not provided, the default title will be used.
     */
    title?: string;

    /**
     * The label for the submit button.
     * If not provided, the default label will be used.
     */
    submitButtonLabel?: string;

    /**
     * Filter of available expertise types.
     * If not provided, all expertise types will be used.
     */
    types?: Set<ExpertiseType>;

    /**
     * The maximum number of expertises that can be set.
     * If not provided, there is no limit.
     */
    maxExpertises?: number;
}

interface EditExpertisesDialogActorConfig
    extends EditExpertisesDialogCommonConfig {
    /**
     * The actor to edit the expertises for.
     */
    actor: CosmereActor;

    /**
     * Whether or not to update the actor in real time
     * with the changes made in the dialog.
     *
     * @default true
     */
    liveUpdate?: boolean;
}

interface EditExpertisesDialogDocumentConfig
    extends EditExpertisesDialogCommonConfig {
    /**
     * The document to edit the expertises for.
     */
    document: CosmereDocument;

    /**
     * The path to the field in the ExpertisesField in the document.
     */
    fieldPath: string;

    /**
     * Whether or not to update the document in real time
     * with the changes made in the dialog.
     *
     * @default true
     */
    liveUpdate?: boolean;
}

interface EditExpertisesDialogDataConfig
    extends EditExpertisesDialogCommonConfig {
    /**
     * The data to edit the expertises for.
     */
    data: Collection<Expertise>;

    /**
     * Whether or not to update the source in real time
     * with the changes made in the dialog.
     * This option is only applicable when an `updater` function is provided.
     *
     * @default false
     */
    liveUpdate?: boolean;

    /**
     * A function to update the source with the new value.
     * If the dialog is in "live update" mode, this function will be called
     * every time the user makes a change to the expertises.
     * Otherwise, it will be called when the user submits the form.
     */
    updater?: (expertises: Collection<Expertise>) => void | Promise<void>;
}

type EditExpertisesDialogDataWithoutUpdaterConfig = Omit<
    EditExpertisesDialogDataConfig,
    'updater'
> & {
    liveUpdate?: false;
    updated?: undefined | null;
};
type EditExpertisesDialogDataWithUpdaterConfig = Omit<
    EditExpertisesDialogDataConfig,
    'updater'
> &
    Pick<Required<EditExpertisesDialogDataConfig>, 'updater'>;

type EditExpertisesDialogConfig =
    | EditExpertisesDialogActorConfig
    | EditExpertisesDialogDocumentConfig
    | EditExpertisesDialogDataConfig;

export class EditExpertisesDialog extends HandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                minimizable: false,
                positioned: true,
            },
            classes: ['edit-expertises', 'dialog'],
            tag: 'dialog',
            position: {
                width: 300,
                height: 800,
            },

            /**
             * NOTE: Unbound methods is the standard for defining actions and forms
             * within ApplicationV2
             */
            /* eslint-disable @typescript-eslint/unbound-method */
            actions: {
                'add-custom-expertise': this.onAddCustomExpertise,
                'remove-custom-expertise': this.onRemoveCustomExpertise,
                'update-expertises': this.onSave,
            },
            /* eslint-enable @typescript-eslint/unbound-method */
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_EDIT_EXPERTISES}`,
                scrollable: [''],
                // See note above
                /* eslint-disable @typescript-eslint/unbound-method */
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
                /* eslint-enable @typescript-eslint/unbound-method */
            },
        },
    );

    private data: Collection<Expertise>;
    private updater?: (
        expertises: Collection<Expertise>,
    ) => void | Promise<void>;
    private liveUpdate: boolean;
    private availableTypes: Set<ExpertiseType>;
    private submitButtonLabel: string;
    private maxExpertises?: number;
    private resolve: (value: Collection<Expertise> | null | void) => void;

    private constructor(config: {
        data: Collection<Expertise>;
        resolve: (value: Collection<Expertise> | null | void) => void;
        id?: string;
        updater?: (expertises: Collection<Expertise>) => void | Promise<void>;
        liveUpdate?: boolean;
        title?: string;
        submitButtonLabel?: string;
        types?: Set<ExpertiseType>;
        maxExpertises?: number;
    }) {
        super({
            id: config.id ?? '{id}',
            window: {
                title: config.title ?? 'COSMERE.Actor.Sheet.EditExpertises',
            },
        });

        this.data = config.data;
        this.resolve = config.resolve;
        this.updater = config.updater;
        this.liveUpdate = config.liveUpdate ?? false;
        this.availableTypes =
            config.types ??
            new Set(
                Object.keys(CONFIG.COSMERE.expertiseTypes) as ExpertiseType[],
            );
        this.submitButtonLabel =
            config.submitButtonLabel ?? 'GENERIC.Button.Update';
        this.maxExpertises = config.maxExpertises;
    }

    /* --- Statics --- */

    public static show(actor: CosmereActor): Promise<void>;
    public static show(
        document: CosmereDocument,
        fieldPath: string,
    ): Promise<void>;
    public static show(config: EditExpertisesDialogActorConfig): Promise<void>;
    public static show(
        config: EditExpertisesDialogDocumentConfig,
    ): Promise<void>;
    public static show(
        config: EditExpertisesDialogDataWithUpdaterConfig,
    ): Promise<void>;
    public static show(
        config: EditExpertisesDialogDataWithoutUpdaterConfig,
    ): Promise<Collection<Expertise> | null>;
    public static show(
        ...args:
            | [CosmereActor]
            | [CosmereDocument, string]
            | [EditExpertisesDialogConfig]
    ): Promise<Collection<Expertise> | null> | Promise<void> {
        // Init config from args
        const config =
            args[0] instanceof CosmereActor
                ? ({ actor: args[0] } as EditExpertisesDialogActorConfig)
                : args[0] instanceof foundry.abstract.Document
                  ? ({
                        document: args[0],
                        fieldPath: args[1],
                    } as EditExpertisesDialogDocumentConfig)
                  : args[0];

        // Validate field path if required
        if ('document' in config) {
            const field = config.document.schema.getField(config.fieldPath);

            // Ensure field is correct type
            if (!(field instanceof ExpertisesField)) {
                throw new Error(
                    `Field "${config.fieldPath}" is not a valid ExpertisesField`,
                );
            }
        }

        // Get data
        const data =
            'actor' in config
                ? config.actor.system.expertises
                : 'document' in config
                  ? (foundry.utils.getProperty(
                        config.document,
                        config.fieldPath,
                    ) as Collection<Expertise>)
                  : config.data;

        // Determine the id
        const id =
            'actor' in config
                ? `${config.actor.uuid}.system.expertises`
                : 'document' in config
                  ? `${config.document.uuid}.${config.fieldPath}`
                  : undefined;

        // Determine the updater
        const updater =
            'actor' in config
                ? (data: Collection<Expertise>) =>
                      this.updateDocument(
                          config.actor,
                          'system.expertises',
                          data,
                      )
                : 'document' in config
                  ? (data: Collection<Expertise>) =>
                        this.updateDocument(
                            config.document,
                            config.fieldPath,
                            data,
                        )
                  : config.updater;

        // Show the dialog
        return new Promise((resolve) => {
            const dialog = new EditExpertisesDialog({
                data: cloneCollection(data),
                resolve,
                id,
                liveUpdate:
                    config.liveUpdate ??
                    ('actor' in config || 'document' in config),
                updater,
                title: config.title,
                submitButtonLabel: config.submitButtonLabel,
                types: config.types,
                maxExpertises: config.maxExpertises,
            });
            void dialog.render(true);
        }) as Promise<Collection<Expertise> | null> | Promise<void>;
    }

    private static updateDocument(
        document: CosmereDocument,
        fieldPath: string,
        data: Collection<Expertise>,
    ) {
        // Get changes
        const changes = getObjectChanges(
            (
                foundry.utils.getProperty(
                    document,
                    fieldPath,
                ) as Collection<Expertise>
            ).toJSON(),
            data.toJSON(),
        );

        // Update the document
        void document.update({
            [fieldPath]: changes,
        });
    }

    /* --- Accessors --- */

    public get shouldUpdateSource() {
        return !!this.updater;
    }

    /* --- Actions --- */

    private static onRemoveCustomExpertise(
        this: EditExpertisesDialog,
        event: Event,
    ) {
        // Get action element
        const actionElement = $(event.target!).closest('[data-action]');

        // Get id and type
        const id = actionElement.data('id') as string;
        const type = actionElement.data('category') as ExpertiseType;

        // Remove the expertise
        this.data.delete(Expertise.getKey({ type, id }));

        // Update the source, if applicable
        if (this.liveUpdate) {
            this.preformSourceUpdate();
        }

        // Remove
        $(event.target!).closest('li').remove();
    }

    private static onAddCustomExpertise(
        this: EditExpertisesDialog,
        event: Event,
    ) {
        if (
            this.maxExpertises !== undefined &&
            this.data.size >= this.maxExpertises
        ) {
            return void ui.notifications.warn(
                game.i18n!.format(
                    'DIALOG.EditExpertise.Warning.MaxExpertises',
                    {
                        max: this.maxExpertises,
                    },
                ),
            );
        }

        // Look up the category
        const category = $(event.target!)
            .closest('[data-category]')
            .data('category') as ExpertiseType;

        // Generate element
        const el = $(`
            <li id="temp-custom" class="form-group custom temp">                
                <i class="bullet fade icon faded fa-solid fa-diamond"></i>
                <input type="text" placeholder="${game.i18n!.localize('DIALOG.EditExpertise.AddPlaceholder')}">
                <a><i class="fa-solid fa-trash"></i></a>
            </li>
        `).get(0)!;

        // Insert element
        $(event.target!).closest('li').before(el);

        // Find input element
        const inputEl = $(el).find('input');

        // Focus
        inputEl.trigger('focus');
        inputEl.on('focusout', () => {
            const val = inputEl.val();

            if (val) {
                const label = val;
                const id = val.toLowerCase();

                // Initialize expertise
                const expertise = new Expertise({
                    id,
                    type: category,
                    label,
                });

                if (
                    !expertise.isCustom ||
                    containsExpertise(this.data, expertise)
                ) {
                    ui.notifications.warn(
                        game.i18n!.localize(
                            'GENERIC.Warning.NoDuplicateExpertises',
                        ),
                    );
                } else {
                    // Add expertise
                    this.data.set(expertise.key, expertise);

                    // Update the source, if applicable
                    if (this.liveUpdate) {
                        this.preformSourceUpdate();
                    }

                    // Render
                    void this.render();
                }
            }

            // Clean up
            inputEl.off('focusout');
            el.remove();
        });

        inputEl.on('keypress', (event) => {
            if (event.which !== 13) return; // Enter key

            event.preventDefault();
            event.stopPropagation();

            inputEl.trigger('focusout');
        });
    }

    private static onSave(this: EditExpertisesDialog, event: Event) {
        if (this.liveUpdate) return;

        // Close the dialog
        void this.close();

        if (this.shouldUpdateSource) {
            this.preformSourceUpdate();
            this.resolve();
        } else {
            // Resolve the promise
            this.resolve(this.data);
        }
    }

    /* --- Form --- */

    private static onFormEvent(
        this: EditExpertisesDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;
        event.preventDefault();

        const expertisesKeys = Object.keys(formData.object).filter(
            (key) => !!formData.object[key],
        );

        // Determine added expertises
        const addedExpertises = expertisesKeys.filter(
            (key) => !this.data.has(key),
        );

        // Determine removed expertises
        const removedExpertises = Array.from(this.data.keys()).filter(
            (key) => !expertisesKeys.includes(key),
        );

        // Ensure the maximum number of expertises is not exceeded
        if (
            this.maxExpertises !== undefined &&
            this.data.size + addedExpertises.length - removedExpertises.length >
                this.maxExpertises
        ) {
            ui.notifications.warn(
                game.i18n!.format(
                    'DIALOG.EditExpertise.Warning.MaxExpertises',
                    {
                        max: this.maxExpertises,
                    },
                ),
            );

            // Re-render
            return void this.render();
        }

        // Add new expertises
        addedExpertises.forEach((key) => {
            const [type, id] = key.split(':') as [ExpertiseType, string];
            this.data.set(
                key,
                new Expertise({
                    id,
                    type,
                    label:
                        typeof formData.object[key] === 'string'
                            ? formData.object[key]
                            : null,
                }),
            );
        });

        // Remove expertises
        removedExpertises.forEach((key) => {
            this.data.delete(key);
        });

        if (this.liveUpdate) {
            this.preformSourceUpdate();
        }
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            showSubmitButton: !this.liveUpdate,
            submitButtonLabel: this.submitButtonLabel,

            categories: this.availableTypes.map((type) => {
                const config = CONFIG.COSMERE.expertiseTypes[type];

                return {
                    type,
                    label: config.label,
                    icon: config.icon,
                    configuredExpertises:
                        this.getConfiguredExpertisesForType(type),
                    customExpertises: this.getCustomExpertisesForType(type),
                };
            }),
        });
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
        $(this.element)
            .find('input')
            .on('keypress', (event) => {
                if (event.which !== 13) return; // Enter key

                event.preventDefault();
                event.stopPropagation();

                $(event.target).trigger('blur');
            });
    }

    protected _onClose(options: object): void {
        super._onClose(options);

        // Resolve the promise
        this.resolve(this.shouldUpdateSource ? (void 0 as void) : this.data);
    }

    /* --- Helpers --- */

    private preformSourceUpdate() {
        void this.updater?.(this.data);
    }

    private getConfiguredExpertisesForType(type: ExpertiseType) {
        // Get the registry key
        const registryKey =
            CONFIG.COSMERE.expertiseTypes[type].configRegistryKey;
        if (!registryKey) return [];

        return Object.entries(
            CONFIG.COSMERE[registryKey] as Record<string, { label: string }>,
        ).map(([id, config]) => ({
            id,
            ...config,
            hasExpertise: containsExpertise(this.data, type, id),
            locked: this.data.get(id)?.locked ?? false,
        }));
    }

    private getCustomExpertisesForType(type: ExpertiseType) {
        return this.data.filter(
            (expertise) => expertise.type === type && !!expertise.isCustom,
        );
    }
}
