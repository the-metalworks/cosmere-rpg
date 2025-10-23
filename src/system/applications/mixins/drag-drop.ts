import { AnyObject, ConstructorOf, AnyConcreteApplicationV2Constructor } from '@system/types/utils';

import { HandlebarsApplicationComponent, ComponentHandlebarsApplication } from '@system/applications/component-system';

interface DragDropApplicationConfiguration {
    dragDrop: Omit<foundry.applications.ux.DragDrop.Configuration, 'permissions' | 'callbacks'>[];
}

// TEMP: Workaround
// export function DragDropApplicationMixin<
//     // Config extends foundry.applications.api.ApplicationV2.Configuration &
//     //     DragDropApplicationConfiguration,
//     BaseClass extends AnyConcreteApplicationV2Constructor,
// >(base: BaseClass) {
export function DragDropApplicationMixin<
    BaseClass extends ConstructorOf<ComponentHandlebarsApplication>,
>(base: BaseClass) {
    return class mixin extends base {
        declare options: DragDropApplicationConfiguration;
        private _dragDrop: DragDrop[];

        // NOTE: Must use any to comply with mixin constructor signature
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);

            this._dragDrop = this.createDragDropHandlers();
        }

        private createDragDropHandlers(): DragDrop[] {
            return (this.options.dragDrop ?? []).map(
                (d) =>
                    new foundry.applications.ux.DragDrop({
                        ...d,
                        permissions: {
                            dragstart: this._canDragStart.bind(this),
                            drop: this._canDragDrop.bind(this),
                        },
                        callbacks: {
                            dragstart: this._onDragStart.bind(this),
                            dragover: this._onDragOver.bind(this),
                            drop: this._onDrop.bind(this),
                        },
                    }),
            );
        }

        /* --- Accessors --- */

        public get dragDrop() {
            return this._dragDrop;
        }

        /* --- Lifecycle --- */

        // See note above
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protected async _onRender(context: any, options: any) {
            await super._onRender(context, options);

            // Bind handlers
            this._dragDrop.forEach((d) => d.bind(this.element));
        }

        /* --- Functions --- */

        protected _canDragStart(selector?: string | null): boolean {
            return false;
        }

        protected _canDragDrop(selector?: string | null): boolean {
            return false;
        }

        protected _onDragStart(event: DragEvent) {}

        protected _onDragOver(event: DragEvent) {}

        protected _onDrop(event: DragEvent) {}
    };
}

export function DragDropComponentMixin<
    BaseClass extends ConstructorOf<HandlebarsApplicationComponent>,
>(base: BaseClass) {
    return class mixin extends base {
        static DRAG_DROP: Omit<
            foundry.applications.ux.DragDrop.Configuration,
            'permissions' | 'callbacks'
        >[] = [];

        private _dragDrop: DragDrop[];

        // NOTE: Must use any to comply with mixin constructor signature
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);

            this._dragDrop = this.createDragDropHandlers();
        }

        private createDragDropHandlers(): DragDrop[] {
            const dragDrop = (this.constructor as typeof mixin).DRAG_DROP;

            return dragDrop.map(
                (d) =>
                    new DragDrop({
                        ...d,
                        permissions: {
                            dragstart: this._canDragStart.bind(this),
                            drop: this._canDragDrop.bind(this),
                        },
                        callbacks: {
                            dragstart: this._onDragStart.bind(this),
                            dragover: this._onDragOver.bind(this),
                            drop: this._onDrop.bind(this),
                        },
                    }),
            );
        }

        /* --- Lifecyle --- */

        public _onAttachListeners(params: AnyObject): void {
            super._onAttachListeners(params);

            // Bind handlers
            this._dragDrop.forEach((d) => d.bind(this.element!));
        }

        /* --- Functions --- */

        protected _canDragStart(selector?: string | null): boolean {
            return false;
        }

        protected _canDragDrop(selector?: string | null): boolean {
            return false;
        }

        protected _onDragStart(event: DragEvent) {}

        protected _onDragOver(event: DragEvent) {}

        protected _onDrop(event: DragEvent) {}
    };
}
