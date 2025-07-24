// Import spark-md5 for hashing (used for component ids)
import md5 from 'spark-md5';

import { AnyObject, DeepPartial } from '@system/types/utils';

// Component
import { HandlebarsApplicationComponent } from './component';

// Mixin
import {
    ComponentHandlebarsApplication,
    ComponentHandlebarsRenderOptions,
} from './mixin';

// Types
import {
    ComponentActionHandler,
    ComponentState,
    ApplicationV2Constructor,
} from './types';

const componentClsRegistry: Record<
    string,
    typeof HandlebarsApplicationComponent<ApplicationV2Constructor<AnyObject>>
> = {};

const componentRegistry: Record<
    string,
    {
        selector: string;
        instance: HandlebarsApplicationComponent<
            ApplicationV2Constructor<AnyObject>
        >;
        parentRef?: string;
        params?: Record<string, unknown>;
        element?: HTMLElement;
        dirty?: boolean;
    }
> = {};

const applicationInstances: Record<
    string,
    InstanceType<
        ComponentHandlebarsApplication<ApplicationV2Constructor<AnyObject>>
    >
> = {};

export function registerComponent(
    selector: string,
    componentCls: typeof HandlebarsApplicationComponent<
        ApplicationV2Constructor<AnyObject>
    >,
) {
    if (selector in componentClsRegistry)
        throw new Error(
            `Failed to register component "${selector}". A component with that selector is already registered`,
        );

    // Ensure template is set
    if (!componentCls.TEMPLATE)
        throw new Error(
            `Failed to register component "${selector}". Invalid template. Template cannot be blank`,
        );

    // Add to registry
    componentClsRegistry[selector] = componentCls;

    // Set up helper
    Handlebars.registerHelper(selector, (...args: unknown[]) => {
        /**
         * NOTE: Data field in Handlebars.HelperOptions is any.
         * We have to disable this rule to access the necessary fields
         */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        const options = args[args.length - 1] as Handlebars.HelperOptions & {
            loc: {
                start: { line: number; column: number };
                end: { line: number; column: number };
            };
        };

        // Get from root data
        const application = options.data!.root.__application as InstanceType<
            ComponentHandlebarsApplication<ApplicationV2Constructor<AnyObject>>
        >;
        const partId = (options.data!.root.partId as string).replace(
            `${application.id}-`,
            '',
        );
        const parentRef = (
            (options.data!.root.__componentRef as string) ??
            `${application.id}:${partId}`
        ).split(':');
        const index = getFullIndexRecursive(options.data);

        // Generate id
        const componentId = md5.hash(
            `${selector}-${options.loc.start.line}.${index}.${options.loc.start.column}_${options.loc.end.line}.${options.loc.end.column}`,
        );

        // Append to ref
        const componentRef = [...parentRef, componentId].join(':');

        // Init the component if required
        const wasInitialized = initComponent(selector, componentRef);

        // Get id
        const htmlId = options.hash.id as string | undefined;

        // Get classs
        const cssClass = options.hash.class as string | undefined;

        // Get style
        const cssStyle = options.hash.style as string | undefined;
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */

        // Construct class list
        const cssClassList = [cssClass, ...componentCls.CLASSES]
            .filter((v) => !!v)
            .join(' ');

        // Assign params
        assignParams(componentRef, options.hash);

        // Invoke lifecycle event if required
        if (wasInitialized) {
            const instance = getComponentInstance(componentRef)!;

            instance.dispatchEvent(
                new CustomEvent('initialize', {
                    detail: { params: getComponentParams(componentRef) },
                }),
            );
        } else {
            componentRegistry[componentRef].dirty = false;
        }

        // Return result
        return new Handlebars.SafeString(`
            <${selector} data-component-id="${componentId}" 
                ${htmlId ? `id="${htmlId}"` : ''} 
                ${cssClassList.length > 0 ? `class="${cssClassList}"` : ''}
                ${cssStyle ? `style="${cssStyle}"` : ''}
            >
            </${selector}>
        `);
    });

    if (componentCls.FORM_ASSOCIATED) {
        customElements.define(
            selector,
            class extends HTMLElement {
                static formAssociated = true;

                public value: unknown;
                public name: string | undefined;
            },
        );
    }
}

/* --- Helpers --- */

// See note above
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
function getFullIndexRecursive(
    data?: Handlebars.HelperOptions['data'],
): string | undefined {
    if (!data) return;
    return [data.index ?? '0', getFullIndexRecursive(data._parent)]
        .filter((v) => !!v)
        .join('.');
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */

function assignParams(componentRef: string, hash: AnyObject) {
    // Get params
    const params = Object.entries(hash)
        .filter(([key]) => key !== 'id' && key !== 'class' && key !== 'style')
        .reduce(
            (params, [key, value]) => ({
                ...params,
                [key]: value,
            }),
            {} as Record<string, unknown>,
        );

    // Set params
    componentRegistry[componentRef].params = params;
}

function initComponent(selector: string, componentRef: string): boolean {
    if (!(selector in componentClsRegistry))
        throw new Error(
            `Failed to initialize component "${selector}". No such component registered`,
        );

    // If the component is already initialized, do nothing
    if (componentRef in componentRegistry) return false;

    // Get relevant ids
    const [applicationId, partId, ...componentIds] = componentRef.split(':');
    const componentId = componentIds[componentIds.length - 1];
    const parentRef =
        componentIds.length > 1
            ? [applicationId, partId, ...componentIds.slice(0, -1)].join(':')
            : undefined;

    // Get the application
    const app = applicationInstances[applicationId];

    // Get the class
    const ComponentClass = componentClsRegistry[selector];

    // Init component
    const instance = new ComponentClass(
        componentId,
        selector,
        partId,
        componentRef,
        app,
    );

    // Assign
    componentRegistry[componentRef] = {
        selector,
        instance,
        parentRef,
        dirty: false,
    };
    return true;
}

/* --- Rendering --- */

function onComponentAction(
    this: HandlebarsApplicationComponent,
    handler: ComponentActionHandler,
    event: MouseEvent,
) {
    if (!(event instanceof PointerEvent)) return;
    if (!(event.target instanceof HTMLElement)) return;

    let buttons = [0];
    if (typeof handler === 'object') {
        buttons = handler.buttons;
        handler = handler.handler;
    }

    if (buttons.includes(event.button))
        void handler.call(this, event, event.target);
}

export function registerApplicationInstance(
    application: InstanceType<
        ComponentHandlebarsApplication<ApplicationV2Constructor<AnyObject>>
    >,
) {
    applicationInstances[application.id] = application;
}

export function deregisterApplicationInstance(
    application: InstanceType<
        ComponentHandlebarsApplication<ApplicationV2Constructor<AnyObject>>
    >,
) {
    delete applicationInstances[application.id];

    // Remove all components that belonged to this application
    Object.keys(componentRegistry).forEach((componentRef) => {
        if (componentRef.startsWith(application.id)) {
            delete componentRegistry[componentRef];
        }
    });
}

export function getComponentInstance(componentRef: string) {
    // Check if component already exists in the registry
    if (!(componentRef in componentRegistry)) {
        return undefined;
    } else {
        return componentRegistry[componentRef].instance;
    }
}

export async function renderComponent(
    componentRef: string,
    applicationContext: AnyObject,
    options: DeepPartial<ComponentHandlebarsRenderOptions>,
) {
    // Get component instance
    const instance = getComponentInstance(componentRef);
    if (!instance)
        throw new Error(
            `Failed to render component. Invalid component ref "${componentRef}"`,
        );

    // Get params
    const params = componentRegistry[componentRef].params ?? {};

    // Prepare context
    const context = await instance._prepareContext(
        params,
        applicationContext,
        options,
    );

    // Get component class
    const ComponentClass = componentClsRegistry[instance.selector];

    // Render
    const content = await renderTemplate(ComponentClass.TEMPLATE, {
        ...context,
        ...instance,
        __application: instance.application,
        __componentRef: componentRef,
        partId: instance.partId,
    });

    // To HTML
    const t = document.createElement('template');
    t.innerHTML = content;
    const html = t.content.children;

    // Get all child components
    const childRefs = Object.entries(componentRegistry)
        .filter(([_, { parentRef }]) => parentRef === componentRef)
        .map(([ref]) => ref);

    // Render children
    for (const childRef of childRefs) {
        const childHtml = await renderComponent(
            childRef,
            applicationContext,
            options,
        );
        replaceComponent(childRef, childHtml, $(html) as JQuery);
    }

    // Return result
    return html;
}

export function getComponentState(componentRef: string) {
    // Get component instance
    const instance = getComponentInstance(componentRef);
    if (!instance?.element)
        throw new Error(
            `Failed to get component state. Invalid component ref "${componentRef}"`,
        );

    // Get the component class
    const ComponentClass =
        instance.constructor as typeof HandlebarsApplicationComponent;

    // Prepare return state
    const state = {} as Partial<ComponentState>;

    // Focused element or field
    const focus: HTMLElement | null = instance.element.querySelector(':focus');
    if (focus?.id) state.focus = `#${focus.id}`;
    else if (focus && focus instanceof HTMLInputElement)
        state.focus = `${focus.tagName}[name="${focus.name}"]`;

    // Scroll positions
    state.scrollPositions = [];
    ComponentClass.SCROLLABLE.forEach((scrollSelector) => {
        const scrollElement =
            scrollSelector === ''
                ? instance.element
                : instance.element?.querySelector(scrollSelector);

        if (scrollElement) {
            state.scrollPositions!.push([
                scrollSelector,
                scrollElement.scrollTop,
                scrollElement.scrollLeft,
            ]);
        }
    });

    return state as ComponentState;
}

export function getComponentStatesRecursive(
    rootRef: string,
    states: Record<string, ComponentState> = {},
): Record<string, ComponentState> {
    // Get component instance
    const instance = getComponentInstance(rootRef);
    if (!instance)
        throw new Error(
            `Failed to get component state. Invalid component ref "${rootRef}"`,
        );

    // Ensure instance has element
    if (!instance.element) return states;

    // Get state
    states[rootRef] = getComponentState(rootRef);

    getComponentChildrenRefs(rootRef).forEach((childRef) =>
        getComponentStatesRecursive(childRef, states),
    );

    // Return result
    return states;
}

export function replaceComponent(
    componentRef: string,
    componentContent: HTMLCollection,
    root?: JQuery,
) {
    // Get component instance
    const instance = getComponentInstance(componentRef);
    if (!instance)
        throw new Error(
            `Failed to replace component. Invalid component ref "${componentRef}"`,
        );

    // Get application
    const app = instance.application;

    // Find element
    const element = (root ?? $(app.element)).find(
        `${instance.selector}[data-component-id="${instance.id}"]`,
    );

    // Assign element
    componentRegistry[componentRef].element = element.get(0);

    // Replace content
    element.empty();
    element.append($(componentContent));
}

export function applyComponentState(
    componentRef: string,
    state: ComponentState,
) {
    // Get component instance
    const instance = getComponentInstance(componentRef);
    if (!instance?.element)
        throw new Error(
            `Failed to apply component state. Invalid component ref "${componentRef}"`,
        );

    if (state.focus) {
        const el = instance.element.querySelector(state.focus) as
            | HTMLElement
            | undefined;
        el?.focus();
    }

    state.scrollPositions.forEach(([selector, scrollTop, scrollLeft]) => {
        const target =
            selector === ''
                ? instance.element
                : instance.element?.querySelector(selector);

        if (!target) return;
        Object.assign(target, { scrollTop, scrollLeft });
    });
}

export function attachComponentListeners(componentRef: string) {
    // Get component instance
    const instance = getComponentInstance(componentRef);
    if (!instance)
        throw new Error(
            `Failed to attach component listeners. Invalid component ref "${componentRef}"`,
        );

    // Get the element
    const htmlElement = getComponentElement(componentRef);
    if (!htmlElement)
        throw new Error(
            `Failed to attach component listeners. Component element not set`,
        );

    // Get the component actions
    const actions = (
        instance.constructor as typeof HandlebarsApplicationComponent
    ).ACTIONS;

    // Attach listeners
    Object.entries(actions).forEach(([actionId, handler]) => {
        // Construct selector
        const actionSelector = `[data-action="${actionId}"]`;

        // Find the action elements
        const actionElements = htmlElement.matches(actionSelector)
            ? $(htmlElement)
            : $(htmlElement).find(actionSelector);

        // Add listeners
        actionElements.get().forEach((el) => {
            el.addEventListener(
                'click',
                onComponentAction.bind(instance, handler),
            );
            el.addEventListener(
                'contextmenu',
                onComponentAction.bind(instance, handler),
            );
        });
    });

    // Invoke lifecylce event
    instance.dispatchEvent(
        new CustomEvent('attachListeners', {
            detail: { params: getComponentParams(componentRef) },
        }),
    );

    // Get all child components
    const childRefs = Object.entries(componentRegistry)
        .filter(([_, { parentRef }]) => parentRef === componentRef)
        .map(([ref]) => ref);

    // Attach child component listeners
    childRefs.forEach((childRef) => attachComponentListeners(childRef));
}

export function preRenderApplication(applicationId: string) {
    // Mark all components as dirty
    Object.entries(componentRegistry)
        .filter(([ref]) => ref.startsWith(applicationId))
        .forEach(([ref]) => {
            componentRegistry[ref].dirty = true;
        });
}

export function removeOrphanedComponents(applicationId: string) {
    // Get all components
    const components = Object.entries(componentRegistry).filter(([ref]) =>
        ref.startsWith(applicationId),
    );

    // Remove orphaned components
    components.forEach(([ref, { dirty }]) => {
        if (dirty) {
            delete componentRegistry[ref];
        }
    });
}

export function getComponentElement(componentRef: string) {
    return componentRegistry[componentRef]?.element;
}

export function getComponentParams(componentRef: string) {
    return componentRegistry[componentRef]?.params;
}

export function getComponentChildrenRefs(componentRef: string) {
    return Object.entries(componentRegistry)
        .filter(([_, { parentRef }]) => parentRef === componentRef)
        .map(([ref]) => ref);
}

export function getComponentChildren(componentRef: string) {
    return getComponentChildrenRefs(componentRef).map(
        (ref) => componentRegistry[ref].instance,
    );
}

export function getComponentParentRef(componentRef: string) {
    return componentRegistry[componentRef]?.parentRef;
}

export function getComponentParent(componentRef: string) {
    const parentRef = getComponentParentRef(componentRef);
    return parentRef ? componentRegistry[parentRef].instance : undefined;
}

export function getApplicationComponents(
    applicationId: string,
    partId?: string,
) {
    const prefix = [applicationId, partId].filter((v) => !!v).join(':');

    return Object.entries(componentRegistry)
        .filter(([ref]) => ref.startsWith(prefix))
        .map(([_, { instance }]) => instance);
}

/* --- Hooks --- */

Hooks.on('ready', async () => {
    // Get templates
    const templates = Object.values(componentClsRegistry).map(
        (cls) => cls.TEMPLATE,
    );

    // Pre-load
    await loadTemplates(templates);
});

/* --- Default exports --- */

export default {
    registerComponent,
    getComponentInstance,
    renderComponent,
    getComponentState,
    getComponentStatesRecursive,
    replaceComponent,
    preRenderApplication,
    removeOrphanedComponents,
    applyComponentState,
    attachComponentListeners,
    getComponentElement,
    getComponentParams,
    getComponentChildrenRefs,
    getComponentChildren,
    getComponentParentRef,
    getComponentParent,
    getApplicationComponents,
    registerApplicationInstance,
    deregisterApplicationInstance,
};
