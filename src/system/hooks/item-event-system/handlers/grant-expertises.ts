import { ExpertiseType } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/event-system';
import { Expertise } from '@system/data/actor/common';

// Fields
import { ExpertisesField } from '@system/data/actor/fields/expertises-field';
import { RecordCollection } from '@system/data/fields/collection';

// Dialogs
import { EditExpertisesDialog } from '@system/applications/dialogs/edit-expertises';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface GrantExpertiseHandlerConfigData {
    /**
     * Whether to grant specific expertises or
     * allow the user to choose freely.
     *
     * @default false
     */
    pick?: boolean;

    /**
     * If `pick` is true, the number of expertises to pick.
     * @default 1
     */
    pickAmount?: number;

    /**
     * The expertises to grant.
     * If `pick` is true, this will be ignored
     */
    expertises: Collection<Expertise>;

    /**
     * Whether to allow the user to replace granted expertises
     * if they already have them.
     *
     * @default false
     */
    allowReplacement?: boolean;

    /**
     * Which types of expertises to choose from when replacing
     * granted expertises.
     * If not provided, all expertise types will be used.
     * Only applicable if `allowReplacement` or `pick` is `true`.
     */
    availableTypes: Set<ExpertiseType>;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.GrantExpertises,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.Description`,
        config: {
            schema: {
                pick: new foundry.data.fields.BooleanField({
                    required: false,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.Pick.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.Pick.Hint`,
                }),
                pickAmount: new foundry.data.fields.NumberField({
                    required: false,
                    initial: 1,
                    min: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.PickAmount.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.PickAmount.Hint`,
                }),
                expertises: new ExpertisesField({
                    required: true,
                }),
                allowReplacement: new foundry.data.fields.BooleanField({
                    required: false,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.AllowReplacement.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.AllowReplacement.Hint`,
                }),
                availableTypes: new foundry.data.fields.SetField(
                    new foundry.data.fields.StringField({
                        blank: false,
                        choices: () =>
                            Object.entries(
                                CONFIG.COSMERE.expertiseTypes,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                    }),
                    {
                        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.AvailableTypes.Label`,
                        hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.AvailableTypes.Hint`,
                    },
                ),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_GRANT_EXPERTISES}`,
        },
        executor: async function (
            this: GrantExpertiseHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            // Get the actor
            const actor = event.item.actor;

            let expertises: Expertise[];

            if (this.pick) {
                const result = await EditExpertisesDialog.show({
                    data: new RecordCollection<Expertise>(),
                    types:
                        this.availableTypes.size > 0
                            ? this.availableTypes
                            : undefined,
                    maxExpertises: this.pickAmount ?? 1,
                    title: game.i18n!.format(
                        `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.PickDialog.Title`,
                        {
                            amount: this.pickAmount ?? 1,
                        },
                    ),
                    submitButtonLabel: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.PickDialog.Button`,
                });
                if (!result || result.size === 0) return;

                // If the user picked expertises, use those
                expertises = Array.from(result.values());
            } else {
                // Get the expertises to grant, replacing any that the actor already has if allowed
                expertises = await this.expertises.reduce(
                    async (prev, expertise) => {
                        const acc = await prev;

                        const hasExpertise = actor.hasExpertise(expertise);
                        if (hasExpertise && this.allowReplacement) {
                            const result = await EditExpertisesDialog.show({
                                data: new RecordCollection<Expertise>(),
                                types:
                                    this.availableTypes.size > 0
                                        ? this.availableTypes
                                        : undefined,
                                maxExpertises: 1,
                                title: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.ReplaceExpertise.Title`,
                                submitButtonLabel: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.GrantExpertises}.ReplaceExpertise.Button`,
                            });
                            if (!result || result.size === 0) return acc;

                            // If the user chose a replacement, use that instead
                            const replacement = Array.from(result.values())[0];
                            acc.push(replacement);
                        } else if (!hasExpertise) {
                            // Add the expertise to the list
                            acc.push(expertise);
                        }

                        return acc;
                    },
                    Promise.resolve([] as Expertise[]),
                );
            }

            if (expertises.length === 0) return;

            // Grant the expertises
            await actor.update(
                {
                    'system.expertises': expertises.reduce(
                        (acc, expertise) => ({
                            ...acc,
                            [expertise.key]: expertise.toObject(),
                        }),
                        {},
                    ),
                },
                event.op,
            );
        },
    });
}
