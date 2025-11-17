import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { MouseButton } from '@system/types/utils';

import type { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Utils
import { debounce } from '@system/utils/generic';

export namespace AppContextMenu {
    export interface Item {
        name: string;
        icon: string;
        classes?: string[];
        callback?: (element: HTMLElement) => void;
    }

    export type Parent =
        | foundry.applications.api.ApplicationV2
        | HandlebarsApplicationComponent;

    export type Anchor = 'left' | 'right' | 'cursor';

    export interface Config {
        /**
         * The host for the context menu.
         * This is generally either an Application or an Application Component.
         */
        parent: Parent;

        /**
         * The items to display in the context menu.
         */
        items?: Item[] | ((element: HTMLElement) => Item[]);

        /**
         * The selectors to bind the context menu to.
         */
        selectors?: string[];

        /**
         * Where the context menu should be anchored.
         *
         * - `left`: Anchored to the left of the element.
         * - `right`: Anchored to the right of the element.
         * - `cursor`: Anchored to the location of the cursor when the context menu was opened.
         *
         * @default 'left'
         */
        anchor?: Anchor;

        /**
         * The mouse button that should trigger the context menu.
         *
         * @default MouseButton.Primary
         */
        mouseButton?: MouseButton;
    }
}

type Positioning = {
    top: number;
} & ({ right: number } | { left: number });

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.GENERAL_CONTEXT_MENU}`;

const applicationContextMenus = new WeakMap<
    foundry.applications.api.ApplicationV2,
    Set<AppContextMenu>
>();

document.addEventListener(
    'scroll',
    debounce(
        (event) => {
            if (!(event.target instanceof HTMLElement)) return;

            const target: HTMLElement = event.target;

            const app = Array.from(
                foundry.applications.instances.values(),
            ).find((app) => app.element.contains(target));
            if (!app) return;

            applicationContextMenus
                .get(app)
                ?.filter((menu) => target.contains(menu.parent.element!))
                ?.forEach((menu) => {
                    if (menu.expanded) {
                        menu.hide();
                    }
                });
        },
        50,
        true,
    ),
    true,
);

export class AppContextMenu {
    /**
     * The application that owns this context menu.
     * This is set either explicitly when the parent is an Application,
     * or implicitly when the parent is an Application Component.
     */
    private application: foundry.applications.api.ApplicationV2;

    /**
     * The root element of the context menu.
     */
    private _element?: HTMLElement;

    /**
     * The element that was clicked to open the context menu.
     */
    private contextElement?: HTMLElement;

    private mutationObserver?: MutationObserver;
    private rendered = false;

    private _expanded = false;
    private _active = true;

    private items?: AppContextMenu.Item[];
    private itemsFn?: (element: HTMLElement) => AppContextMenu.Item[];

    private constructor(
        public readonly parent: AppContextMenu.Parent,
        private anchor: AppContextMenu.Anchor,
        items?:
            | AppContextMenu.Item[]
            | ((element: HTMLElement) => AppContextMenu.Item[]),
    ) {
        // Set application
        // @ts-expect-error Foundry Due to foundry-vtt-types issue. TODO: Resolve typing issues
        this.application =
            parent instanceof foundry.applications.api.ApplicationV2
                ? parent
                : parent.application;

        // Register this context menu with the application
        if (!applicationContextMenus.has(this.application)) {
            applicationContextMenus.set(
                this.application,
                new Set<AppContextMenu>(),
            );
        }
        applicationContextMenus.get(this.application)!.add(this);

        if (typeof items === 'function') {
            this.itemsFn = items;
        } else {
            this.items = items;
        }
    }

    public get element(): HTMLElement | undefined {
        return this._element;
    }

    public get active(): boolean {
        return this._active;
    }

    public get expanded(): boolean {
        return this._expanded;
    }

    private set expanded(value: boolean) {
        this._expanded = value;
    }

    /**
     * Utility function to create a context menu
     * and automatically bind it to the elements
     * matching the selectors.
     *
     * This function takes care of re-binding on render.
     * If no selectors are provided, simply call `show` on the context menu.
     */
    public static create(config: AppContextMenu.Config): AppContextMenu {
        // Destructure config
        const {
            parent,
            items,
            selectors,
            anchor = 'left',
            mouseButton,
        } = config;

        // Create context menu
        const menu = new AppContextMenu(parent, anchor, items);

        // Add event listener
        if (selectors) {
            parent.addEventListener('render', () => {
                menu.bind(selectors, mouseButton);
            });
        }

        return menu;
    }

    public bind(selectors: string[], mouseButton?: MouseButton): void;
    public bind(elements: HTMLElement[], mouseButton?: MouseButton): void;
    public bind(
        param1: string[] | HTMLElement[],
        mouseButton: MouseButton = MouseButton.Primary,
    ): void {
        if (param1.length === 0) return;

        const elements: HTMLElement[] = [];
        if (typeof param1[0] === 'string') {
            elements.push(
                ...param1
                    .map((selector) =>
                        $(this.parent.element!)
                            .find(selector as string)
                            .toArray(),
                    )
                    .flat(),
            );
        } else {
            elements.push(...(param1 as HTMLElement[]));
        }

        // Get the event to bind to
        const event =
            mouseButton === MouseButton.Primary ? 'click' : 'contextmenu';

        // Attach listeners
        elements.forEach((element) => {
            element.addEventListener(event, (event) => {
                const shouldShow =
                    !this.expanded || this.contextElement !== element;

                if (this.expanded) this.hide();

                if (shouldShow && this._active) {
                    const rootBounds =
                        this.application.element.getBoundingClientRect();
                    const positioning =
                        this.anchor === 'cursor'
                            ? {
                                  top: event.clientY - rootBounds.top,
                                  left: event.clientX - rootBounds.left,
                              }
                            : undefined;

                    setTimeout(() => {
                        void this.show(element, undefined, positioning);
                    });
                }
            });
        });
    }

    public show(
        element: HTMLElement,
        items?: AppContextMenu.Item[],
        positioning?: Positioning,
    ): Promise<void>;
    public show(
        items: AppContextMenu.Item[],
        positioning: Positioning,
    ): Promise<void>;
    public async show(...args: unknown[]): Promise<void> {
        const firstArgIsElement = args[0] instanceof HTMLElement;

        const element = firstArgIsElement
            ? (args[0] as HTMLElement)
            : this.contextElement;

        let positioning = !firstArgIsElement
            ? (args[1] as Positioning)
            : args.length === 3
              ? (args[2] as Positioning)
              : undefined;

        // Hide other context menus for this application
        applicationContextMenus
            .get(this.application)
            ?.filter((menu) => menu !== this && menu.expanded)
            .forEach((menu) => menu.hide());

        // Set items
        this.items = !firstArgIsElement
            ? (args[0] as AppContextMenu.Item[])
            : (this.itemsFn?.(element!) ?? this.items)!;

        // If the context element is different and items are dynamic, always re-render
        if (
            firstArgIsElement &&
            element !== this.contextElement &&
            this.itemsFn
        )
            this.rendered = false;

        // If the first argument is not an element, re-render
        if (!firstArgIsElement) this.rendered = false;

        // Set the context element
        this.contextElement = element;

        // If not rendered yet, render now
        if (!this.rendered) await this.render();

        if (firstArgIsElement) {
            // Get element bounds
            const elementBounds = element!.getBoundingClientRect();
            const rootBounds = this.application.element.getBoundingClientRect();

            // Figure out positioning with anchor
            positioning = {
                top: elementBounds.top - rootBounds.top,

                ...(this.anchor === 'right'
                    ? {
                          right:
                              rootBounds.right -
                              elementBounds.right +
                              elementBounds.width,
                      }
                    : {
                          left:
                              elementBounds.left -
                              rootBounds.left -
                              elementBounds.width,
                      }),
            };
        }

        // Set positioning
        $(this._element!).css('top', `${positioning!.top}px`);
        if ('right' in positioning!)
            $(this._element!).css('right', `${positioning.right}px`);
        else $(this._element!).css('left', `${positioning!.left}px`);

        // Remove hidden
        $(this._element!).addClass('expanded');
        $(this._element!).removeClass('hidden');

        if (this.anchor === 'cursor' && positioning) {
            $(this._element!).addClass('free');
        }

        // Set expanded
        this.expanded = true;
    }

    public hide() {
        // Hide
        $(this._element!).removeClass('expanded');
        $(this._element!).addClass('hidden');

        // Unset expanded
        this.expanded = false;

        if (this.itemsFn) this.items = undefined;
    }

    public setActive(active: boolean) {
        this._active = active;

        if (!this._active) {
            this.hide();
        }
    }

    public async render(): Promise<void> {
        // Observe visibility changes
        this.observeVisibilityChanges();

        // Clean up old element
        if (this._element) this.destroy();

        // Render the element
        this._element = await this.renderElement();

        // Add hidden class
        $(this._element).addClass('hidden');

        // Attach listeners
        $(this._element)
            .find('button[data-item]')
            .on('click', (event) => {
                // Get the index
                const index = Number(
                    $(event.target).closest('button[data-item]').data('item'),
                );

                // Get the item
                const item = this.items![index];

                // Trigger the callback
                if (item.callback) item.callback(this.contextElement!);

                // Hide the context menu
                this.hide();
            });

        // Add element to parent
        this.application.element.appendChild(this._element);

        // Set rendered flag
        this.rendered = true;
    }

    public destroy(): void {
        if (this._element) {
            this._element.remove();
            this._element = undefined;
        }
    }

    private async renderElement(): Promise<HTMLElement> {
        const htmlStr = await foundry.applications.handlebars.renderTemplate(
            TEMPLATE,
            {
                items: this.items!.map((item) => ({
                    ...item,
                    cssClasses: item.classes?.join(' ') ?? '',
                })),
            },
        );
        const t = document.createElement('template');
        t.innerHTML = htmlStr;
        return t.content.children[0] as HTMLElement;
    }

    /**
     * Observe visibility changes to the parent application / component.
     * If the parent becomes hidden while the context menu is expanded, hide the context menu.
     */
    private observeVisibilityChanges() {
        if (this.mutationObserver) return;

        this.mutationObserver = new MutationObserver((mutations) => {
            const hasRelevantMutation = mutations
                .filter((mutation) => mutation.type === 'attributes')
                .filter((mutation) =>
                    mutation.target.contains(this.parent.element!),
                )
                .some(() => true); // Check if any mutation affects the parent element

            if (!hasRelevantMutation) return;

            // Check if parent is visible
            const parentVisible = this.parent.element!.checkVisibility();

            // If parent is not visible and context menu is expanded, hide it
            if (!parentVisible && this.expanded) {
                this.hide();
            }
        });

        this.mutationObserver.observe(this.application.element, {
            attributes: true,
            subtree: true,
        });
    }
}
