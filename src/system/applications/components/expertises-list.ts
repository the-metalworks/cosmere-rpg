import { ConstructorOf } from '@system/types/utils';

import { Expertise } from '@system/data/actor/fields/expertises-field';

// Dialog
import { EditExpertisesDialog } from '@system/applications/dialogs/edit-expertises';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../actor/base';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;
    value?: Collection<Expertise>;
    readonly?: boolean;
    collapsible?: boolean;
};

export class ExpertisesListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    Params
> {
    static FORM_ASSOCIATED = true;

    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_EXPERTISES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-expertises': this.onEditExpertises,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private _value = new Collection<Expertise>();
    private _name?: string;
    private _collapsed = false;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: Collection<Expertise> })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { name?: string; value: Collection<Expertise> })
            | undefined;
    }

    public get readonly() {
        return this.params?.readonly === true;
    }

    public get collapsible() {
        return this.params?.collapsible ?? true;
    }

    public get collapsed() {
        return this._collapsed;
    }

    public get value() {
        return this._value;
    }

    public set value(value: Collection<Expertise>) {
        this._value = value;

        // Set value
        this.element!.value = value;

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change', { bubbles: true }));
    }

    public get name() {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;

        // Set name
        this.element!.name = value;
        $(this.element!).attr('name', value ?? '');
    }

    public get expertises() {
        return this.application instanceof BaseActorSheet
            ? this.application.actor.system.expertises
            : this._value;
    }

    /* --- Actions --- */

    private static onEditExpertises(
        this: ExpertisesListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (this.application instanceof BaseActorSheet) {
            void EditExpertisesDialog.show(this.application.actor);
        } else {
            void EditExpertisesDialog.show({
                data: this.expertises,
                liveUpdate: true,
                updater: (expertises: Collection<Expertise>) => {
                    this.value = expertises;
                },
            });
        }
    }

    /* --- Lifecycle --- */

    protected override _onInitialize() {
        if (this.params!.value) {
            this._value = this.params!.value;
        } else if (!(this.application instanceof BaseActorSheet)) {
            console.warn(
                `ExpertisesListComponent: No value provided, and the application is not a BaseActorSheet. This component will not work as expected.`,
            );
        }

        this._collapsed =
            this.application instanceof BaseActorSheet
                ? this.application.areExpertisesCollapsed
                : false;
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

        // Set value
        this.element!.value = this.value ?? '';

        // Set name
        if (this.params!.name) {
            this.name = this.params!.name;
        }

        // Set readonly
        if (this.params!.readonly) {
            $(this.element!).attr('readonly', 'readonly');
        }

        if (this.collapsible) {
            $(this.element!)
                .find('.collapsible .icon-header')
                .on('click', (event) => this.onClickCollapsible(event));
        }
    }

    protected override _onDestroy(): void {
        // Setting a flag causes a document update and therefore a re-render.
        // We don't want to re-render every time we collapse a section because it breaks CSS transitions.
        // This flag is therefore only stored once at the end when closing the document so that
        // it is available in the correct state when we next open the document and get the flag in prepareContext.
        if (this.application instanceof BaseActorSheet) {
            void this.application.actor.setFlag(
                SYSTEM_ID,
                'sheet.expertisesCollapsed',
                this._collapsed,
            );
        }

        super._onDestroy();
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
        this._collapsed = !this._collapsed;
    }

    /* --- Context --- */

    public _prepareContext(params: object, context: object) {
        return Promise.resolve({
            ...context,

            isEditMode:
                this.application instanceof BaseActorSheet
                    ? (context as BaseActorSheetRenderContext).isEditMode
                    : !this.readonly,
            shouldDisplay:
                this.application instanceof BaseActorSheet
                    ? (context as BaseActorSheetRenderContext).isEditMode ||
                      this.expertises.size > 0
                    : true,
            collapsible: this.collapsible,
            collapsed: this.collapsed,
            expertises:
                this.expertises
                    .map((expertise) => {
                        const config =
                            CONFIG.COSMERE.expertiseTypes[expertise.type];

                        return {
                            ...expertise,
                            typeLabel: config.label,
                            typeIcon: config.icon,
                        };
                    })
                    .sort((e1, e2) => e1.type.compare(e2.type)) ?? [],
        });
    }
}

// Register
ExpertisesListComponent.register('app-expertises-list');
