import { AnyObject, DeepPartial } from '@system/types/utils';

// Component system
import ComponentSystem from './system';

// Component application
import {
    ComponentHandlebarsApplication,
    ComponentHandlebarsRenderOptions,
} from './mixin';

// Types
import { ApplicationV2Constructor, ComponentEvent } from './types';

export class HandlebarsApplicationComponent<
    BaseClass extends ApplicationV2Constructor<
        AnyObject,
        foundry.applications.api.ApplicationV2.Configuration,
        foundry.applications.api.ApplicationV2.RenderOptions
    > = ApplicationV2Constructor<
        AnyObject,
        foundry.applications.api.ApplicationV2.Configuration,
        foundry.applications.api.ApplicationV2.RenderOptions
    >,
    Params extends AnyObject = AnyObject,
    out RenderContext extends
        AnyObject = BaseClass extends ApplicationV2Constructor<infer R>
        ? R
        : never,
> extends foundry.utils.EventEmitterMixin(Object) {
    static emittedEvents = ['initialize', 'attachListeners', 'render'];

    /**
     * The template entry-point for the Component
     */
    public static readonly TEMPLATE: string = '';

    /**
     * An array of CSS classes to apply to the top-level element of the
     * rendered component.
     */
    public static readonly CLASSES: string[] = [];

    /**
     * An array of selectors within this component whose scroll positions should
     * be persisted during a re-render operation. A blank string is used
     * to denote that the root level of the component is scrollable.
     */
    public static readonly SCROLLABLE: string[] = [];

    /**
     * A registry of forms selectors and submission handlers.
     */
    public static readonly FORMS: Record<
        string,
        foundry.applications.api.ApplicationV2.FormConfiguration
    > = {};

    /**
     * Click actions supported by this Component and their event handler functions.
     * A handler function can be defined directly which only
     * responds to left-click events. Otherwise, an object can be declared
     * containing both a handler function and an array of buttons which are
     * matched against the PointerEvent#button property.
     */
    public static readonly ACTIONS: foundry.applications.api.ApplicationV2.Configuration['actions'] =
        {};

    /**
     * Whether this Component is form associated.
     */
    public static FORM_ASSOCIATED = false;

    constructor(
        public readonly id: string,
        public readonly selector: string,
        public readonly partId: string,
        public readonly ref: string,
        public readonly application: InstanceType<
            ComponentHandlebarsApplication<BaseClass>
        >,
    ) {
        super();

        this.addEventListener('initialize', (event) =>
            this._onInitialize((event as ComponentEvent<Params>).detail.params),
        );
        this.addEventListener('render', (event) =>
            this._onRender((event as ComponentEvent<Params>).detail.params),
        );
        this.addEventListener('attachListeners', (event) =>
            this._onAttachListeners(
                (event as ComponentEvent<Params>).detail.params,
            ),
        );
    }

    public get element(): HTMLElement | undefined {
        return ComponentSystem.getComponentElement(this.ref);
    }

    public get params(): Params | undefined {
        return ComponentSystem.getComponentParams(this.ref) as Params;
    }

    public get childRefs(): string[] {
        return ComponentSystem.getComponentChildrenRefs(this.ref);
    }

    public get children(): HandlebarsApplicationComponent[] {
        return ComponentSystem.getComponentChildren(this.ref);
    }

    public get parentRef(): string | undefined {
        return ComponentSystem.getComponentParentRef(this.ref);
    }

    public get parent(): HandlebarsApplicationComponent | undefined {
        return ComponentSystem.getComponentParent(this.ref);
    }

    /* --- Rendering --- */

    /**
     * Render this component
     */
    protected async render() {
        await this.application.render({
            parts: [],
            componentRefs: [this.ref],
        });

        return this;
    }

    /* --- Context --- */

    /**
     * Prepare Component rendering context data for a given render request.
     * @param params    - The params passed to the Component from the part
     * @param context   - The application render context
     * @param options   - Options which configure rendering behavior
     * @returns         Context data for the rendering operation
     * @virtual
     */
    public _prepareContext(
        params: Params,
        context: RenderContext,
        options: DeepPartial<ComponentHandlebarsRenderOptions>,
    ): Promise<AnyObject> {
        return Promise.resolve({});
    }

    /* --- Lifecycle --- */

    /**
     * Actions performed after Component initialization.
     */
    protected _onInitialize(params: Params) {}

    /**
     * Actions performed after Component rendering.
     */
    protected _onRender(params: Params) {}

    /**
     * Actions performed after Component listeners are attached.
     * Use this to attach your own event listeners.
     * @param params
     */
    protected _onAttachListeners(params: Params) {}

    /* --- Registration --- */

    public static register(selector: string) {
        ComponentSystem.registerComponent(selector, this);
    }
}
