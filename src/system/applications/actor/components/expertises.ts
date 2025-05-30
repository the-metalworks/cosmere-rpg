import { AnyObject, ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialog
import { EditExpertisesDialog } from '../dialogs/edit-expertises';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

export class ActorExpertisesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_EXPERTISES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-expertises': this.onEditExpertises,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private sectionCollapsed =
        this.application.actor.getFlag(
            SYSTEM_ID,
            'sheet.expertisesCollapsed',
        ) || false;

    /* --- Actions --- */

    private static async onEditExpertises(
        this: ActorExpertisesComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        await EditExpertisesDialog.show(this.application.actor);
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            sectionCollapsed: this.sectionCollapsed,

            expertises:
                this.application.actor.system.expertises
                    ?.map((expertise) => ({
                        ...expertise,
                        typeLabel:
                            CONFIG.COSMERE.expertiseTypes[expertise.type].label,
                        typeIcon:
                            CONFIG.COSMERE.expertiseTypes[expertise.type].icon,
                    }))
                    .sort((e1, e2) => e1.type.compare(e2.type)) ?? [],
        });
    }

    /* --- Lifecycle --- */

    protected _onRender(params: AnyObject): void {
        super._onRender(params);

        $(this.element!)
            .find('.collapsible .icon-header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');

        // Update the flag for next render
        void this.application.actor.setFlag(
            SYSTEM_ID,
            'sheet.expertisesCollapsed',
            !this.application.areExpertisesCollapsed,
        );
        this.sectionCollapsed = !this.sectionCollapsed;
    }
}

// Register
ActorExpertisesComponent.register('app-actor-expertises');
