import { CosmereActor } from '@system/documents';
import { AnyObject, DeepPartial } from '@system/types/utils';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';
import HandlebarsApplicationMixin from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/handlebars-application.mjs';

const { ApplicationV2, DocumentSheetV2 } = foundry.applications.api;

export class ConfigureSkillsDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                title: 'COSMERE.Actor.Sheet.ConfigureSkills',
                minimizable: false,
                positioned: true,
            },
            classes: ['dialog', 'configure-skills'],
            tag: 'dialog',
            position: {
                width: 400,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/actors/adversary/dialogs/configure-skills.hbs',
            },
        },
    );

    private constructor(private actor: CosmereActor) {
        super({
            id: `${actor.uuid}.skills`,
        });
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor) {
        await new ConfigureSkillsDialog(actor).render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onFirstRender(context: AnyObject, options: AnyObject) {
        super._onFirstRender(context, options);

        this.actor.apps[this.id] = this;
    }

    protected _onClose(options: AnyObject) {
        super._onClose(options);

        if (this.id in this.actor.apps) {
            delete this.actor.apps[this.id];
        }
    }

    /* --- Context --- */

    protected _prepareContext() {
        return Promise.resolve({
            actor: this.actor,
            attributeGroups: Object.keys(CONFIG.COSMERE.attributeGroups),
            isEditMode: true,
        });
    }
}
