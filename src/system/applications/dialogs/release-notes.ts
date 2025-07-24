import { AnyObject } from '@system/types/utils';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface ReleaseNotesDialogOptions {
    /**
     * Whether to show the patch notes.
     */
    patch?: boolean;
}

export class ReleaseNotesDialog extends HandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                resizable: true,
            },
            position: {
                width: 800,
            },
            classes: ['cosmere', 'dialog', 'release-notes'],
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            release: {
                template: 'systems/cosmere-rpg/release-notes.html',
            },
            patch: {
                template: 'systems/cosmere-rpg/patch-notes.html',
            },
        },
    );

    private patch: boolean;

    private constructor(options: ReleaseNotesDialogOptions = {}) {
        super({
            window: {
                title: game.i18n!.localize('DIALOG.ReleaseNotes.Title'),
            },
        });

        this.patch = options.patch ?? false;
    }

    /* --- Statics --- */

    static async show(options: ReleaseNotesDialogOptions = {}) {
        await new this(options).render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);

        $(this.element).attr('open', 'true');

        if (this.patch) {
            $(this.element).find('[data-application-part="release"]').hide();
            $(this.element).find('[data-application-part="patch"]').show();
        } else {
            $(this.element).find('[data-application-part="release"]').show();
            $(this.element).find('[data-application-part="patch"]').hide();
        }
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            version: game.system!.version,
        });
    }
}
