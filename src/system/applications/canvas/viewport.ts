import { World } from './world';

export interface ViewportOptions {
    /**
     * Whether to allow panning.
     * @default true
     */
    allowPan?: boolean;

    /**
     * Whether to allow zooming.
     * @default true
     */
    allowZoom?: boolean;

    /**
     * Optional bounds for the viewport.
     * If provided, the viewport will be constrained to these bounds.
     */
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export class Viewport extends PIXI.Container {
    private _view: Viewport.View;

    public allowPan: boolean;
    public allowZoom: boolean;
    public viewBounds?: { x: number; y: number; width: number; height: number };

    // Interaction
    private panning = false;

    public constructor(
        private app: PIXI.Application,
        private world: World,
        options: ViewportOptions = {},
    ) {
        super();

        this.allowPan = options.allowPan ?? true;
        this.allowZoom = options.allowZoom ?? true;

        // Add world to viewport
        this.addChild(world);

        // Set view
        this._view = {
            x: 0,
            y: 0,
            zoom: 1,
            width: this.app.renderer.width,
            height: this.app.renderer.height,
        };

        // Set view bounds if provided
        this.viewBounds = options.bounds;

        // Add viewport to app
        this.app.stage.addChild(this);

        // Set event mode
        this.eventMode = 'static';

        // Attach event listeners
        this.app.renderer.addListener('resize', this._onResize.bind(this));
        this.on('wheel', (e) => this._onWheel(e as WheelEvent));
        this.on('mousedown', (e) => this._onMouseDown(e as MouseEvent));
        this.on('mouseup', (e) => this._onMouseUp(e as MouseEvent));
        this.on('mouseout', (e) => this._onMouseOut(e as MouseEvent));
        this.on('mousemove', (e) => this._onMouseMove(e as MouseEvent));
    }

    /* --- Initialization --- */

    public async initialize() {
        // Initialize world
        await this.world.initialize();
    }

    /* --- Accessors --- */

    public get view(): DeepReadonly<Viewport.View> {
        return this._view;
    }

    public set view(view: Partial<Viewport.View>) {
        view = {
            ...this._view,
            ...view,
        };

        // Clamp zoom - min and max
        view.zoom = Math.min(
            Math.max(view.zoom ?? this._view.zoom, Viewport.MIN_ZOOM_DEFAULT),
            Viewport.MAX_ZOOM_DEFAULT,
        );

        // Clamp zoom - if view bounds are set, ensure zoom does not exceed bounds
        if (this.viewBounds) {
            const zoomXLimit = this._view.width / this.viewBounds.width;
            const zoomYLimit = this._view.height / this.viewBounds.height;
            const zoomLimit = Math.max(zoomXLimit, zoomYLimit);

            view.zoom = Math.max(view.zoom, zoomLimit);
        }

        const minX = this.viewBounds
            ? this.viewBounds.x * view.zoom
            : -Number.MAX_VALUE;
        const minY = this.viewBounds
            ? this.viewBounds.y * view.zoom
            : -Number.MAX_VALUE;
        const maxX = this.viewBounds
            ? minX + this.viewBounds.width * view.zoom
            : Number.MAX_VALUE;
        const maxY = this.viewBounds
            ? minY + this.viewBounds.height * view.zoom
            : Number.MAX_VALUE;

        // Clamp x and y
        view.x = Math.max(minX, Math.min(maxX - this._view.width, view.x!));
        view.y = Math.max(minY, Math.min(maxY - this._view.height, view.y!));

        // Update view
        this._view = view as Viewport.View;

        // Update world
        this.world.position.set(-this._view.x, -this._view.y);
        this.world.scale.set(this._view.zoom);
    }

    public get visibleBounds(): PIXI.Rectangle {
        return new PIXI.Rectangle(
            this._view.x / this._view.zoom,
            this._view.y / this._view.zoom,
            this._view.width / this._view.zoom,
            this._view.height / this._view.zoom,
        );
    }

    /* --- Drawing --- */

    public async draw(force = false) {
        await this.world.draw(force);
    }

    /* --- Utility --- */

    /**
     * Converts a point from view coordinates to world coordinates.
     */
    public viewToWorld(point: PIXI.IPointData): PIXI.IPointData {
        return {
            x: (point.x + this._view.x) / this._view.zoom,
            y: (point.y + this._view.y) / this._view.zoom,
        };
    }

    /**
     * Converts a point from world coordinates to view coordinates.
     */
    public worldToView(point: PIXI.IPointData): PIXI.IPointData {
        return {
            x: point.x * this._view.zoom - this._view.x,
            y: point.y * this._view.zoom - this._view.y,
        };
    }

    /* --- Event handlers --- */

    protected _onResize() {
        // Get actual app width and height
        const boundingRect = this.app.view.getBoundingClientRect?.();

        // Update viewport size
        this._view.width = boundingRect?.width ?? this.app.view.width;
        this._view.height = boundingRect?.height ?? this.app.view.height;

        // // Set size
        // this.width = this._view.width;
        // this.height = this._view.height;
    }

    protected _onMouseDown(event: MouseEvent) {
        if (!this.allowPan) return;

        // Set panning
        this.panning = true;
    }

    protected _onMouseUp(event: MouseEvent) {
        // Set panning
        this.panning = false;
    }

    protected _onMouseOut(event: MouseEvent) {
        // Set panning
        this.panning = false;
    }

    protected _onMouseMove(event: MouseEvent) {
        if (!this.panning) return;

        // Get delta
        const dx = event.movementX;
        const dy = event.movementY;

        // Update view
        this.view = {
            x: this.view.x - dx,
            y: this.view.y - dy,
        };
    }

    protected _onWheel(event: WheelEvent) {
        if (!this.allowZoom) return;

        // Get delta
        const delta = event.deltaY;

        // Get zoom change
        let zoom =
            delta > 0
                ? -Viewport.ZOOM_STEP_DEFAULT
                : Viewport.ZOOM_STEP_DEFAULT;

        // Clamp zoom - min and max
        zoom = Math.min(
            Math.max(zoom, Viewport.MIN_ZOOM_DEFAULT - this.view.zoom),
            Viewport.MAX_ZOOM_DEFAULT - this.view.zoom,
        );

        // Clamp zoom - if view bounds are set, ensure zoom does not exceed bounds
        if (this.viewBounds) {
            const zoomXLimit = this._view.width / this.viewBounds.width;
            const zoomYLimit = this._view.height / this.viewBounds.height;
            const zoomLimit = Math.max(zoomXLimit, zoomYLimit);

            zoom = Math.max(zoom, zoomLimit - this.view.zoom);
        }

        const worldSpaceCenter = this.viewToWorld({
            x: this._view.width / 2,
            y: this._view.height / 2,
        });

        const newWorldSpaceCenter = {
            x: worldSpaceCenter.x / (1 + zoom),
            y: worldSpaceCenter.y / (1 + zoom),
        };

        const diff = {
            x: newWorldSpaceCenter.x - worldSpaceCenter.x,
            y: newWorldSpaceCenter.y - worldSpaceCenter.y,
        };

        // Update view
        this.view = {
            zoom: this.view.zoom + zoom,
            x: this.view.x - diff.x * (1 + zoom),
            y: this.view.y - diff.y * (1 + zoom),
        };
    }
}

export namespace Viewport {
    export const ZOOM_STEP_DEFAULT = 0.1;
    export const MIN_ZOOM_DEFAULT = 0.1;
    export const MAX_ZOOM_DEFAULT = 10;

    export interface Dimensions {
        width: number;
        height: number;
    }

    export interface View extends Dimensions {
        x: number;
        y: number;
        zoom: number;
    }
}
