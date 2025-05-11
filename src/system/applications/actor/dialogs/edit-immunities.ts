import { Status, DamageType, ImmunityType } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EditImmunitiesDialog extends HandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                title: 'COSMERE.Actor.Sheet.EditImmunities',
                minimizable: false,
                positioned: true,
            },
            classes: ['edit-immunities', 'dialog'],
            tag: 'dialog',
            position: {
                width: 300,
                height: 800,
            },

            /**
             * NOTE: Unbound methods is the standard for defining actions and forms
             * within ApplicationV2
             */
            // /* eslint-disable @typescript-eslint/unbound-method */
            // actions: {
            //     'add-custom-immunities': this.onAddCustomImmunity,
            //     'remove-custom-immunities': this.onRemoveCustomImmunity,
            // },
            // /* eslint-enable @typescript-eslint/unbound-method */
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_EDIT_IMMUNITIES}`,
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
            id: `${actor.uuid}.immunities`,
        });
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor) {
        // Show the dialog
        await new EditImmunitiesDialog(actor).render(true);
    }

    /* --- Actions --- */

    // private static onRemoveCustomImmunity(
    //     this: EditImmunitiesDialog,
    //     event: Event,
    // ) {
    //     // Get action element
    //     const actionElement = $(event.target!).closest('[data-action]');

    //     // Get id and type
    //     const id = actionElement.data('id') as string;
    //     const type = actionElement.data('category') as ImmunityType;

    //     // Get immunities
    //     const immunities = this.actor.system.immunities ?? [];

    //     // Find index
    //     const index = immunities.findIndex(
    //         (expertise) => expertise.type === type && expertise.id === id,
    //     );

    //     // Remove
    //     immunities.splice(index, 1);

    //     // Update
    //     void this.actor.update({
    //         'system.expertises': immunities,
    //     });

    //     // Remove
    //     $(event.target!).closest('li').remove();
    // }

    // private static onAddCustomImmunity(
    //     this: EditImmunitiesDialog,
    //     event: Event,
    // ) {
    //     // Look up the category
    //     const category = $(event.target!)
    //         .closest('[data-category]')
    //         .data('category') as ImmunityType;

    //     // Generate element
    //     const el = $(`
    //         <li id="temp-custom" class="form-group custom temp">
    //             <i class="bullet fade icon faded fa-solid fa-diamond"></i>
    //             <input type="text" placeholder="${game.i18n!.localize('DIALOG.EditExpertise.AddPlaceholder')}">
    //             <a><i class="fa-solid fa-trash"></i></a>
    //         </li>
    //     `).get(0)!;

    //     // Insert element
    //     $(event.target!).closest('li').before(el);

    //     // Find input element
    //     const inputEl = $(el).find('input');

    //     // Focus
    //     inputEl.trigger('focus');
    //     inputEl.on('focusout', async () => {
    //         const val = inputEl.val();
    //         if (val) {
    //             const label = val;
    //             const id = val.toLowerCase();

    //             if (this.actor.hasExpertise(category, id)) {
    //                 ui.notifications.warn(
    //                     game.i18n!.localize(
    //                         'GENERIC.Warning.NoDuplicateExpertises',
    //                     ),
    //                 );
    //             } else {
    //                 // Get expertises
    //                 const expertises = this.actor.system.expertises ?? [];

    //                 // Add expertise
    //                 expertises.push({
    //                     id,
    //                     label,
    //                     type: category,
    //                     custom: true,
    //                 });

    //                 // Update the actor
    //                 await this.actor.update({
    //                     'system.expertises': expertises,
    //                 });

    //                 // Render
    //                 void this.render();
    //             }
    //         }

    //         // Clean up
    //         el.remove();
    //     });

    //     inputEl.on('keypress', (event) => {
    //         if (event.which !== 13) return; // Enter key

    //         event.preventDefault();
    //         event.stopPropagation();

    //         inputEl.trigger('focusout');
    //     });
    // }

    /* --- Form --- */

    private static onFormEvent(
        this: EditImmunitiesDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        event.preventDefault();

        const data = formData.object as AnyObject;
        const paths = Object.keys(data);

        const configuredImmunities = paths
            .filter((path) => typeof data[path] === 'boolean')
            .map((path) => {
                const [type, name] = path.split('.');
                return {
                    type: type as ImmunityType,
                    label: this.getLabelForImmunity(
                        type as ImmunityType,
                        name,
                    )!,
                    isImmune: data[path] as boolean,
                };
            })
            .filter((i) => i.isImmune)
            .partition((i) => i.type === ImmunityType.Condition);

        // const customExpertises = paths
        //     .filter((path) => typeof data[path] === 'string')
        //     .map((path) => {
        //         const [type, id] = path.split('.');
        //         return {
        //             id,
        //             type: type as ImmunityType,
        //             hasExpertise: true,
        //             label: data[path] as string,
        //             custom: true,
        //         };
        //     });

        // // Contact to single array
        // const expertises = [...configuredImmunities, ...customExpertises];

        // Get immunities
        const currentImmunities = this.actor.system.immunities;

        const immunityDiffersCheck = (
            action: 'add' | 'remove',
            name: string,
            currentValue: boolean,
            type: ImmunityType,
        ) => {
            return action === 'add'
                ? // any immunities that aren't currently enabled but are found in the filtered input list
                  !currentValue &&
                      configuredImmunities[
                          type === ImmunityType.Damage ? 0 : 1
                      ].findIndex(
                          (input) => input.label.toLowerCase() === name,
                      ) > -1
                : // any immunities that are currently enabled but aren't found in the filtered input list
                  currentValue &&
                      configuredImmunities[
                          type === ImmunityType.Damage ? 0 : 1
                      ].findIndex(
                          (input) => input.label.toLowerCase() === name,
                      ) === -1;
        };

        // Figure out changes
        const damageRemovals = Object.entries(currentImmunities.damage).filter(
            ([name, value]) =>
                immunityDiffersCheck(
                    'remove',
                    name,
                    value,
                    ImmunityType.Damage,
                ),
        );
        const damageAdditions = Object.entries(currentImmunities.damage).filter(
            ([name, value]) =>
                immunityDiffersCheck('add', name, value, ImmunityType.Damage),
        );
        const conditionRemovals = Object.entries(
            currentImmunities.condition,
        ).filter(([name, value]) =>
            immunityDiffersCheck('remove', name, value, ImmunityType.Condition),
        );
        const conditionAdditions = Object.entries(
            currentImmunities.condition,
        ).filter(([name, value]) =>
            immunityDiffersCheck('add', name, value, ImmunityType.Condition),
        );

        // Mutate current immunities
        damageRemovals.forEach(
            ([name]) => (currentImmunities.damage[name as DamageType] = false),
        );
        damageAdditions.forEach(
            ([name]) => (currentImmunities.damage[name as DamageType] = true),
        );
        conditionRemovals.forEach(
            ([name]) => (currentImmunities.condition[name as Status] = false),
        );
        conditionAdditions.forEach(
            ([name]) => (currentImmunities.condition[name as Status] = true),
        );

        // // Set labels for custom expertises
        // customExpertises.forEach((e) => {
        //     const index = currentImmunities.findIndex(
        //         (o) => o.id === e.id && o.type === e.type,
        //     );

        //     currentImmunities[index].label = e.label;
        // });

        // Update actor
        void this.actor.update({
            'system.immunities': currentImmunities,
        });
    }

    /* --- Context --- */

    protected _prepareContext() {
        // Get all configured immunity types
        const immunityTypes = Object.keys(
            CONFIG.COSMERE.immunityTypes,
        ) as ImmunityType[];

        return Promise.resolve({
            actor: this.actor,

            categories: immunityTypes.map((type) => {
                const config = CONFIG.COSMERE.immunityTypes[type];

                return {
                    type,
                    label: config.label,
                    configuredImmunities:
                        this.getConfiguredImmunitiesForType(type),
                };
            }),
            icons: {
                damage: {
                    ...Object.entries(CONFIG.COSMERE.damageTypes).reduce(
                        (
                            acc: Record<string, string>,
                            [damageType, damageConfig],
                        ) => ({
                            ...acc,
                            [damageType]:
                                damageConfig.icon ?? 'fa-circle-exclamation',
                        }),
                        {},
                    ),
                },
                condition: {
                    ...Object.entries(CONFIG.COSMERE.statuses).reduce(
                        (
                            acc: Record<string, string>,
                            [condiName, condiConfig],
                        ) => ({
                            ...acc,
                            [condiName]:
                                condiConfig.icon ?? 'fa-circle-exclamation',
                        }),
                        {},
                    ),
                },
            },
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

    private getConfiguredImmunitiesForType(type: ImmunityType) {
        if (type === ImmunityType.Damage) {
            return Object.entries(CONFIG.COSMERE.damageTypes).map(
                ([name, config]) => ({
                    name,
                    ...config,
                    isImmune: this.actor.hasImmunity(type, name as DamageType),
                }),
            );
        } else if (type === ImmunityType.Condition) {
            return Object.entries(CONFIG.COSMERE.statuses).map(
                ([name, config]) => ({
                    name,
                    ...config,
                    isImmune: this.actor.hasImmunity(type, name as Status),
                }),
            );
        } else {
            return [];
        }
    }

    private getLabelForImmunity(type: ImmunityType, name: string) {
        if (type === ImmunityType.Damage) {
            return game.i18n!.localize(
                Object.entries(CONFIG.COSMERE.damageTypes)?.find(
                    ([damageType]) => damageType === name,
                )?.[1].label ?? '',
            );
        } else if (type === ImmunityType.Condition) {
            return game.i18n!.localize(
                Object.entries(CONFIG.COSMERE.statuses)?.find(
                    ([conditionName]) => conditionName === name,
                )?.[1].label ?? '',
            );
        } else {
            return undefined;
        }
    }
}
