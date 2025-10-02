import { CosmereActor } from '@system/documents';
import { AnyObject, DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

const { ApplicationV2 } = foundry.applications.api;

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
                width: 300,
            },
        },
    ) as foundry.applications.api.ApplicationV2.DefaultOptions;

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ADVERSARY_CONFIGURE_SKILLS}`,
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

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected async _onFirstRender(context: AnyObject, options: AnyObject) {
        await super._onFirstRender(context, options);

        // TODO: Resolve foundry-vtt-types typing issues
        // @ts-expect-error Configure skills dialog is not assignable to Application.Any
        this.actor.apps[this.id] = this;
    }

    protected _onClose(options: AnyObject) {
        super._onClose(options);

        if (this.id in this.actor.apps) {
            delete this.actor.apps[this.id];
        }
    }

    /* --- Context --- */

    public async _prepareContext() {
        return {
            ...(await super._prepareContext()),
            actor: this.actor,
            attributeGroups: Object.keys(CONFIG.COSMERE.attributeGroups),
            isEditMode: true,
        };
    }
}
