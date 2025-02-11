import { AttributeGroup } from '@system/types/cosmere';
import { CosmereActor } from '@system/documents';
import { AnyObject } from '@system/types/utils';

import { CommonActorData } from '@system/data/actor/common';
import { Derived } from '@system/data/fields';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConfigureDefenseDialog extends HandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            window: {
                minimizable: false,
                positioned: true,
            },
            classes: ['dialog', 'configure-defense'],
            tag: 'dialog',
            position: {
                width: 350,
            },
            actions: {
                'update-defense': this.onUpdateDefense,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ACTOR_CONFIGURE_DEFENSE}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private defenseData: CommonActorData['defenses'][keyof CommonActorData['defenses']];
    private mode: Derived.Mode;

    private constructor(
        private actor: CosmereActor,
        private group: AttributeGroup,
    ) {
        super({
            id: `${actor.uuid}.AttributeGroup.${group}.Defense`,
            window: {
                title: game
                    .i18n!.localize('DIALOG.ConfigureDefense.Title')
                    .replace(
                        '{attribute-group}',
                        game.i18n!.localize(
                            CONFIG.COSMERE.attributeGroups[group].label,
                        ),
                    )
                    .replace('{actor}', actor.name),
            },
        });

        this.defenseData = this.actor.system.defenses[group];
        this.defenseData.override =
            this.defenseData.override ?? this.defenseData.value ?? 10;
        this.mode = this.defenseData.mode;
    }

    /* --- Statics --- */

    public static async show(actor: CosmereActor, group: AttributeGroup) {
        await new ConfigureDefenseDialog(actor, group).render(true);
    }

    /* --- Actions --- */

    private static onUpdateDefense(this: ConfigureDefenseDialog) {
        void this.actor.update({
            [`system.defenses.${this.group}`]: this.defenseData,
        });
        void this.close();
    }

    /* --- Form --- */

    private static onFormEvent(
        this: ConfigureDefenseDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        const target = event.target as HTMLInputElement;

        this.mode = formData.object.mode as Derived.Mode;

        if (this.mode === Derived.Mode.Override && target.name === 'formula')
            this.defenseData.override = formData.object.formula as number;

        if (target.name === 'bonus')
            this.defenseData.bonus = formData.object.bonus as number;

        // Assign mode
        this.defenseData.mode = this.mode;

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    protected _prepareContext() {
        // Get attribute group config
        const config = CONFIG.COSMERE.attributeGroups[this.group];

        // Construct formula
        const formula = `10 + @attr.${config.attributes[0]} + @attr.${config.attributes[1]} + @bonus`;

        return Promise.resolve({
            actor: this.actor,
            group: this.group,
            ...config,
            formula,
            mode: this.mode,
            modes: Derived.Modes,
            override: this.defenseData.override!,
            bonus: this.defenseData.bonus,
        });
    }
}
