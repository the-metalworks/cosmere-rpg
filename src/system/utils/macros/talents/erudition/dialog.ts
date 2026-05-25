// Types
import type { CosmereActor } from '@src/system/documents/actor';
import type { EruditionConfig, EruditionSelections, PickedExpertise } from './types';
import type { Expertise } from '@src/system/data/actor/common';
import type { ExpertiseType, Skill } from '@src/system/types/cosmere';
import type { AnyObject } from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { SYSTEM_ID } from '@src/system/constants';

const { HandlebarsApplicationMixin } = foundry.applications.api;

export interface EruditionDialogConfig {
    actor: CosmereActor;
    config: EruditionConfig;
    selected: EruditionSelections;
}

interface EruditionDialogSelections {
    skills: Skill[];
    expertises: PickedExpertise[];
}

interface FormDataObject {
    skills: Skill;
    expertises: Record<ExpertiseType, Expertise>;
}

export class EruditionDialog extends HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
)<AnyObject> {
    static DEFAULT_OPTIONS = {
        window: {
            minimizable: false,
            resizable: false,
            positioned: true,
        },
        classes: ['dialog', 'erudition'],
        tag: 'dialog',
        position: {
            width: 500,
        },
    };

    static PARTS = {
        form: {
            template: `systems/${SYSTEM_ID}/templates/general/dialogs/erudition.hbs`,
            forms: {
                form: {
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    handler: this.onFormEvent,
                    submitOnChange: true,
                    closeOnSubmit: false,
                },
            },
        },
    };

    private submitted = false;

    private availableSkills: string[] = [];

    private constructor(
        private actor: CosmereActor,
        private config: EruditionConfig,
        private selections: EruditionDialogSelections,
        private resolve: (selections: EruditionDialogSelections | null) => void,
    ) {
        super({
            id: `${actor.uuid}.talent.erudition.dialog`,
            window: {
                title: game.i18n.format(
                    'COSMERE.Macro.Talents.Erudition.Dialog.Title',
                    {
                        actor: actor.name,
                    },
                ),
            },
        });

        const attributeGroups = this.config.skills.groups;
        const attributes = attributeGroups.flatMap(
            (group) => CONFIG.COSMERE.attributeGroups[group]?.attributes || [],
        );
        this.availableSkills = attributes
            .flatMap((attrId) => CONFIG.COSMERE.attributes[attrId].skills || [])
            .filter((skill) => CONFIG.COSMERE.skills[skill]?.core);
    }

    /* --- Statics --- */

    public static show(
        config: EruditionDialogConfig,
    ): Promise<EruditionDialogSelections | null> {
        const selections: EruditionDialogSelections = {
            skills: config.selected.skills,
            expertises: config.selected.expertises
                .map(
                    (exp) =>
                        config.actor.system.expertises?.[
                            `${exp.type}:${exp.id}`
                        ] as Expertise,
                )
                .filter(Boolean)
                .map((exp) => ({
                    type: exp.type,
                    id: exp.id,
                    label: exp.label,
                    custom: exp.isCustom,
                })) as PickedExpertise[],
        };

        return new Promise((resolve) => {
            const dialog = new EruditionDialog(
                config.actor,
                foundry.utils.deepClone(config.config),
                foundry.utils.deepClone(selections),
                resolve,
            );
            void dialog.render(true);
        });
    }

    /* --- Form --- */

    private static onFormEvent(
        this: EruditionDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        const data = foundry.utils.expandObject(
            formData.object,
        ) as FormDataObject;
        const skills = Object.values(data.skills) as Skill[];
        const expertises = Object.values(data.expertises || {}).map((exp) => ({
            type: exp.type,
            id: exp.id, // Either the id or 'custom' for custom expertises
            label: exp.label,
            custom: exp.id === 'custom',
            trueId:
                exp.id !== 'custom'
                    ? exp.id
                    : (exp.label?.toLowerCase() ?? '<custom>'),
        }));

        // For each expertise, ensure the id is set correctly
        for (const exp of expertises.filter((exp) => !exp.custom)) {
            // Look up the configured expertises for the type
            const registryKey = CONFIG.COSMERE.expertiseTypes[exp.type]
                .configRegistryKey as PropertyKey;
            const configuredExpertises =
                foundry.utils.getProperty(CONFIG.COSMERE, registryKey) || {};

            if (!foundry.utils.hasProperty(configuredExpertises, exp.id)) {
                exp.custom = true; // Mark as custom if the id is not found
                exp.id = 'custom';
                exp.trueId = exp.label?.toLowerCase() ?? '<custom>';
            }
        }

        // For each custom expertise, ensure it is valid
        for (const exp of expertises.filter((exp) => exp.custom)) {
            // Look up the configured expertises for the type
            const registryKey = CONFIG.COSMERE.expertiseTypes[exp.type]
                .configRegistryKey as PropertyKey;
            const configuredExpertises =
                foundry.utils.getProperty(CONFIG.COSMERE, registryKey) || {};

            if (foundry.utils.hasProperty(configuredExpertises, exp.trueId)) {
                exp.id = exp.trueId;
                exp.custom = false; // Mark as not custom anymore
            }
        }

        if (!(event instanceof SubmitEvent)) {
            // assign the skills and expertises to the selections
            this.selections.skills = skills;
            this.selections.expertises = expertises as PickedExpertise[];

            // Re-render the dialog
            void this.render(true);
        } else {
            // Ensure the skills are unique
            const uniqueSkills = new Set(skills);
            if (uniqueSkills.size !== skills.length) {
                ui.notifications.warn(
                    game.i18n.localize(
                        'COSMERE.Macro.Talents.Erudition.Dialog.Warn.UniqueSkills',
                    ),
                );
                return;
            }

            // Ensure the expertises are unique
            const uniqueExpertises = new Set(
                expertises.map((exp) => `${exp.type}:${exp.trueId}`),
            );
            if (uniqueExpertises.size !== expertises.length) {
                ui.notifications.warn(
                    game.i18n.localize(
                        'COSMERE.Macro.Talents.Erudition.Dialog.Warn.UniqueExpertises',
                    ),
                );
                return;
            }

            // Resolve
            this.resolve({
                skills: skills,
                expertises: expertises.map(
                    (exp) =>
                        ({
                            id: exp.custom ? exp.trueId : exp.id,
                            type: exp.type,
                            label: exp.custom ? exp.label : undefined,
                            custom: exp.custom,
                            locked: true,
                        }) as PickedExpertise,
                ),
            });

            // Mark submitted
            this.submitted = true;

            // Close
            void this.close();
        }
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

    // Disabled this rule because AnyObject is not allowed to be passed to super._prepareContext
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected async _prepareContext(options: any) {
        return {
            ...(await super._prepareContext(options)),
            actor: this.actor,
            config: this.config,
            selections: this.selections,
            skillSelectOptions: this.availableSkills.reduce((acc, skillId) => {
                const skillConfig = CONFIG.COSMERE.skills[skillId as Skill];
                return {
                    ...acc,
                    [skillId]: skillConfig.label,
                };
            }, {}),
            expertiseTypeSelectOptions: this.config.expertises.types.reduce(
                (acc, type) => {
                    const expertiseTypeConfig =
                        CONFIG.COSMERE.expertiseTypes[type];

                    return {
                        ...acc,
                        [type]: expertiseTypeConfig.label,
                    };
                },
                {},
            ),
            expertiseIdSelectOptionsByType: this.config.expertises.types.reduce(
                (acc, type) => {
                    const expertiseTypeConfig =
                        CONFIG.COSMERE.expertiseTypes[type];
                    const registryKey =
                        expertiseTypeConfig.configRegistryKey as PropertyKey;

                    // Look up the expertises registered for this type
                    const expertises = (foundry.utils.getProperty(
                        CONFIG.COSMERE,
                        registryKey,
                    ) || {}) as Record<string, Expertise>;
                    const selectOptions = {
                        ...Object.entries(expertises)
                            .filter(
                                ([id]) =>
                                    !this.actor.hasExpertise(type, id) ||
                                    this.selections.expertises.some(
                                        (exp) =>
                                            exp.id === id && exp.type === type,
                                    ),
                            )
                            .reduce((acc, [id, expConfig]) => {
                                return {
                                    ...acc,
                                    [id]: expConfig.label ?? id,
                                };
                            }, {}),
                        custom: 'GENERIC.Custom',
                    };

                    return {
                        ...acc,
                        [type]: selectOptions,
                    };
                },
                {},
            ),
            defaultExpertise: {
                type: this.config.expertises.types[0],
            },
        };
    }
}
