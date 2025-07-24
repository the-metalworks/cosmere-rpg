import { CharacterActor, CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';

import { Derived } from '@system/data/fields';

// Constants
const TEMPLATE =
    'systems/cosmere-rpg/templates/actors/character/dialogs/short-rest.hbs';

interface ShortRestDialogOptions {
    /**
     * Who is tending to this actor?
     */
    tendedBy?: CharacterActor;
}

interface ShortRestDialogResult {
    /**
     * Whether or not to perform the rest.
     */
    performRest: boolean;

    /**
     * Who is tending to this actor?
     * Will always be undefined if `performRest` is `false`.
     */
    tendedBy?: CharacterActor;
}

export class ShortRestDialog extends foundry.applications.api.DialogV2 {
    private constructor(
        private actor: CharacterActor,
        private resolve: (result: ShortRestDialogResult) => void,
        content: string,
    ) {
        super({
            id: `${actor.uuid}.rest`,
            window: {
                title: 'COSMERE.Actor.Sheet.ShortRest',
            },
            content,
            buttons: [
                {
                    label: 'GENERIC.Button.Continue',
                    action: 'continue',
                    // NOTE: Callback must be async
                    // eslint-disable-next-line @typescript-eslint/require-await
                    callback: async () => this.onContinue(),
                },
                {
                    label: 'GENERIC.Button.Cancel',
                    action: 'cancel',
                    // eslint-disable-next-line @typescript-eslint/require-await
                    callback: async () => resolve({ performRest: false }),
                },
            ],
        });
    }

    /* --- Statics --- */

    public static async show(
        actor: CharacterActor,
        options: ShortRestDialogOptions = {},
    ): Promise<ShortRestDialogResult> {
        // Get all player characters (except for the resting character)
        const playerCharacters = (game.users as Collection<User>)
            .map((user) => user.character)
            .filter(
                (character) =>
                    character &&
                    character instanceof CosmereActor &&
                    character.isCharacter(),
            )
            .filter(
                (character) => character!.id !== actor.id,
            ) as CharacterActor[];

        // Render dialog inner HTML
        const content = await renderTemplate(TEMPLATE, {
            characters: {
                none: game.i18n!.localize('GENERIC.None'),

                ...playerCharacters.reduce(
                    (acc, character) => ({
                        ...acc,
                        [character.id]: character.name,
                    }),
                    {} as Record<string, string>,
                ),
            },
            tendedBy: options.tendedBy?.id ?? 'none',
            formula: Derived.getValue(actor.system.recovery.die),
        });

        // Render dialog and wrap as promise
        return new Promise((resolve) => {
            void new ShortRestDialog(actor, resolve, content).render(true);
        });
    }

    /* --- Actions --- */

    private onContinue() {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            tendedBy: HTMLSelectElement;
        };

        // Get tended by
        const tendedById = form.tendedBy.value;
        const tendedBy =
            tendedById !== 'none'
                ? (CosmereActor.get(tendedById) as CharacterActor)
                : undefined;

        // Resolve
        this.resolve({
            performRest: true,
            tendedBy,
        });
    }

    /* --- Lifecycle --- */

    protected _onRender(context: never, options: AnyObject) {
        super._onRender(context, options);

        // Event handler for tended by selection
        $(this.element)
            .find('select[name="tendedBy"]')
            .on('change', (event) => {
                // Get tended by
                const tendedBy = $(event.target).val() as string;

                if (tendedBy === 'none') {
                    // Set formula
                    $(this.element)
                        .find('input[name="formula"]')
                        .val(
                            Derived.getValue(this.actor.system.recovery.die) ??
                                '',
                        );
                } else {
                    // Get the character
                    const character = CosmereActor.get(
                        tendedBy,
                    ) as CharacterActor;

                    // Get the medicine modifier
                    const mod =
                        Derived.getValue(character.system.skills.med.mod) ?? 0;

                    // Set formula
                    $(this.element)
                        .find('input[name="formula"]')
                        .val(
                            `${Derived.getValue(this.actor.system.recovery.die)} + ${mod}`,
                        );
                }
            });
    }
}
