import { ExpertiseType } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EditExpertisesDialog extends HandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                title: 'COSMERE.Actor.Sheet.EditExpertises',
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
            },
            /* eslint-enable @typescript-eslint/unbound-method */
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_BASE_EDIT_EXPERTISES}`,
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

    private constructor(private actor: CosmereActor) {
        super({
            id: `${actor.uuid}.expertises`,
        });
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor) {
        // Show the dialog
        await new EditExpertisesDialog(actor).render(true);
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

        // Get expertises
        const expertises = this.actor.system.expertises ?? [];

        // Find index
        const index = expertises.findIndex(
            (expertise) => expertise.type === type && expertise.id === id,
        );

        // Remove
        expertises.splice(index, 1);

        // Update
        void this.actor.update({
            'system.expertises': expertises,
        });

        // Remove
        $(event.target!).closest('li').remove();
    }

    private static onAddCustomExpertise(
        this: EditExpertisesDialog,
        event: Event,
    ) {
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
        inputEl.on('focusout', async () => {
            const val = inputEl.val();
            if (val) {
                const label = val;
                const id = val.toLowerCase();

                if (this.actor.hasExpertise(category, id)) {
                    ui.notifications.warn(
                        game.i18n!.localize(
                            'GENERIC.Warning.NoDuplicateExpertises',
                        ),
                    );
                } else {
                    // Get expertises
                    const expertises = this.actor.system.expertises ?? [];

                    // Add expertise
                    expertises.push({
                        id,
                        label,
                        type: category,
                        custom: true,
                    });

                    // Update the actor
                    await this.actor.update({
                        'system.expertises': expertises,
                    });

                    // Render
                    void this.render();
                }
            }

            // Clean up
            el.remove();
        });

        inputEl.on('keypress', (event) => {
            if (event.which !== 13) return; // Enter key

            event.preventDefault();
            event.stopPropagation();

            inputEl.trigger('focusout');
        });
    }

    /* --- Form --- */

    private static onFormEvent(
        this: EditExpertisesDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        event.preventDefault();

        const data = formData.object as AnyObject;
        const paths = Object.keys(data);

        const configuredExpertises = paths
            .filter((path) => typeof data[path] === 'boolean')
            .map((path) => {
                const [type, id] = path.split('.');
                return {
                    id,
                    type: type as ExpertiseType,
                    label: this.getLabelForExpertise(
                        type as ExpertiseType,
                        id,
                    )!,
                    hasExpertise: data[path] as boolean,
                    custom: false,
                };
            })
            .filter((e) => e.hasExpertise);

        const customExpertises = paths
            .filter((path) => typeof data[path] === 'string')
            .map((path) => {
                const [type, id] = path.split('.');
                return {
                    id,
                    type: type as ExpertiseType,
                    hasExpertise: true,
                    label: data[path] as string,
                    custom: true,
                };
            });

        // Contact to single array
        const expertises = [...configuredExpertises, ...customExpertises];

        // Get expertises
        const currentExpertises = this.actor.system.expertises ?? [];

        // Figure out changes
        const removals = currentExpertises.filter(
            (e) => !expertises.some((o) => o.id === e.id && o.type === e.type),
        );
        const additions = expertises.filter(
            (e) =>
                !currentExpertises.some(
                    (o) => o.id === e.id && o.type === e.type,
                ),
        );

        // Mutate current expertises
        removals.forEach((e) => {
            const index = currentExpertises.findIndex(
                (o) => o.id === e.id && o.type === e.type,
            );
            currentExpertises.splice(index, 1);
        });
        additions.forEach((e) => {
            currentExpertises.push({
                type: e.type,
                id: e.id,
                label: e.label,
                custom: e.custom,
            });
        });

        // Set labels for custom expertises
        customExpertises.forEach((e) => {
            const index = currentExpertises.findIndex(
                (o) => o.id === e.id && o.type === e.type,
            );

            currentExpertises[index].label = e.label;
        });

        // Update actor
        void this.actor.update({
            'system.expertises': currentExpertises,
        });
    }

    /* --- Context --- */

    protected _prepareContext() {
        // Get all configured expertises types
        const expertiseTypes = Object.keys(
            CONFIG.COSMERE.expertiseTypes,
        ) as ExpertiseType[];

        return Promise.resolve({
            actor: this.actor,

            categories: expertiseTypes.map((type) => {
                const config = CONFIG.COSMERE.expertiseTypes[type];

                return {
                    type,
                    label: config.label,
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

    /* --- Helpers --- */

    private getConfiguredExpertisesForType(type: ExpertiseType) {
        if (type === ExpertiseType.Weapon) {
            return Object.entries(CONFIG.COSMERE.weapons).map(
                ([id, config]) => ({
                    id,
                    ...config,
                    hasExpertise: this.actor.hasExpertise(type, id),
                    locked:
                        this.actor.system.expertises?.find((e) => e.id === id)
                            ?.locked ?? false,
                }),
            );
        } else if (type === ExpertiseType.Armor) {
            return Object.entries(CONFIG.COSMERE.armors).map(
                ([id, config]) => ({
                    id,
                    ...config,
                    hasExpertise: this.actor.hasExpertise(type, id),
                    locked:
                        this.actor.system.expertises?.find((e) => e.id === id)
                            ?.locked ?? false,
                }),
            );
        } else if (type === ExpertiseType.Cultural) {
            return Object.entries(CONFIG.COSMERE.cultures).map(
                ([id, config]) => ({
                    id,
                    ...config,
                    hasExpertise: this.actor.hasExpertise(type, id),
                    locked:
                        this.actor.system.expertises?.find((e) => e.id === id)
                            ?.locked ?? false,
                }),
            );
        } else {
            return [];
        }
    }

    private getCustomExpertisesForType(type: ExpertiseType) {
        return (
            this.actor.system.expertises?.filter(
                (expertise) => expertise.type === type && expertise.custom,
            ) ?? []
        );
    }

    private getLabelForExpertise(type: ExpertiseType, id: string) {
        if (type === ExpertiseType.Weapon) {
            return game.i18n!.localize(
                Object.entries(CONFIG.COSMERE.weapons)?.find(
                    ([weaponId]) => weaponId === id,
                )?.[1].label ?? '',
            );
        } else if (type === ExpertiseType.Armor) {
            return game.i18n!.localize(
                Object.entries(CONFIG.COSMERE.armors)?.find(
                    ([armorId]) => armorId === id,
                )?.[1].label ?? '',
            );
        } else if (type === ExpertiseType.Cultural) {
            return game.i18n!.localize(
                Object.entries(CONFIG.COSMERE.cultures)?.find(
                    ([cultureId]) => cultureId === id,
                )?.[1].label ?? '',
            );
        } else {
            return undefined;
        }
    }
}
