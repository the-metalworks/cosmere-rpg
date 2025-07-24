import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { CharacterActor, CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_CHARACTER_SHORT_REST}`;

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
        private resolve: (result: ShortRestDialogResult | null) => void,
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

    /* --- Lifecycle --- */

    protected _onClose() {
        this.resolve(null);
    }

    /* --- Statics --- */

    public static async show(
        actor: CharacterActor,
        options: ShortRestDialogOptions = {},
    ): Promise<ShortRestDialogResult | null> {
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
            formula: actor.system.recovery.die.value,
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
                        .val(this.actor.system.recovery.die.value ?? '');
                } else {
                    // Get the character
                    const character = CosmereActor.get(
                        tendedBy,
                    ) as CharacterActor;

                    // Get the medicine modifier
                    const mod = character.system.skills.med.mod.value ?? 0;

                    // Set formula
                    $(this.element)
                        .find('input[name="formula"]')
                        .val(
                            `${this.actor.system.recovery.die.value} + ${mod}`,
                        );
                }
            });
    }
}
