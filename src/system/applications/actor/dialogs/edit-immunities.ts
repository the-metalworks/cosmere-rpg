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
                    icon: config.icon,
                    configuredImmunities:
                        this.getConfiguredImmunitiesForType(type),
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
