import { AnyObject, ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialog
import { EditImmunitiesDialog } from '../dialogs/edit-immunities';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { DamageType, Status } from '@src/system/types/cosmere';

export class ActorImmunitiesComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_IMMUNITIES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-immunities': this.onEditImmunities,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private sectionCollapsed = false;

    /* --- Actions --- */

    private static async onEditImmunities(
        this: ActorImmunitiesComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        await EditImmunitiesDialog.show(this.application.actor);
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        const immunities = [
            ...Object.entries(
                this.application.actor.system.immunities?.damage,
            ).map(([immunityName, value]) => ({
                name: immunityName,
                label: game.i18n?.localize(
                    CONFIG.COSMERE.damageTypes[immunityName as DamageType]
                        .label,
                ),
                isImmune: value,
                typeIcon: CONFIG.COSMERE.immunityTypes.damage.icon,
                typeLabel: game.i18n?.localize(
                    CONFIG.COSMERE.immunityTypes.damage.label,
                ),
            })),
            ...Object.entries(
                this.application.actor.system.immunities?.condition,
            ).map(([immunityName, value]) => ({
                name: immunityName,
                label: game.i18n?.localize(
                    CONFIG.COSMERE.statuses[immunityName as Status].label,
                ),
                isImmune: value,
                typeIcon: CONFIG.COSMERE.immunityTypes.condition.icon,
                typeLabel: game.i18n?.localize(
                    CONFIG.COSMERE.immunityTypes.condition.label,
                ),
            })),
        ];

        return Promise.resolve({
            ...context,
            sectionCollapsed: this.sectionCollapsed,
            immunities,
        });
    }

    /* --- Lifecycle --- */

    protected _onInitialize(params: AnyObject): void {
        super._onInitialize(params);
        // TODO: Resolve typing issues
        // @ts-expect-error ActorImmunitiesComponent is not typed to have application of type BaseActorSheet due to foundry-vtt-types issues
        this.sectionCollapsed = this.application
            .areImmunitiesCollapsed as boolean;
    }

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
        this.sectionCollapsed = !this.sectionCollapsed;

        if (!this.application.isEditable) return;

        void this.application.actor.update(
            {
                flags: {
                    'cosmere-rpg': {
                        'sheet.immunitiesCollapsed': this.sectionCollapsed,
                    },
                },
            },
            { render: false },
        );
    }
}

// Register
ActorImmunitiesComponent.register('app-actor-immunities');
