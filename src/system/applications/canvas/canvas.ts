import { Viewport } from './viewport';
import { World } from './world';
import { CanvasDebug } from './debug';

interface PIXICanvasApplicationOptions<
    CWorld extends typeof World = typeof World,
    CViewport extends typeof Viewport = typeof Viewport,
> {
    /**
     * Class to use for the viewport.
     */
    viewportClass?: CViewport;

    /**
     * Class to use for the world.
     */
    worldClass?: CWorld;

    /**
     * Transparceny of the background from 0 (transparent) to 1 (opaque).
     *
     * @default 0
     */
    backgroundAlpha?: number;

    /**
     * Background color used to clear the canvas.
     *
     * @default 'black'
     */
    backgroundColor?: PIXI.ColorSource;
}

export class PIXICanvasApplication<
    CWorld extends typeof World = typeof World,
    CViewport extends typeof Viewport = typeof Viewport,
    TWorld extends World = InstanceType<CWorld>,
    TViewport extends Viewport = InstanceType<CViewport>,
> {
    public readonly debug: CanvasDebug = new CanvasDebug();
    public readonly app: PIXI.Application;

    private _world: TWorld;
    private _viewport: TViewport;

    constructor(options: Partial<PIXICanvasApplicationOptions> = {}) {
        this.app = new PIXI.Application({
            backgroundAlpha: options.backgroundAlpha ?? 0,
            backgroundColor: options.backgroundColor ?? 'black',
            autoDensity: true,
            antialias: true,
            width: 200,
            height: 200,
        });
        this.app.renderer.resolution = window.devicePixelRatio;

        // Create world container
        this._world = new (options.worldClass ?? World)(this) as TWorld;

        // Create viewport
        this._viewport = new (options.viewportClass ?? Viewport)(
            this.app,
            this._world,
        ) as TViewport;

        // Add debug graphics
        this.app.stage.addChild(this.debug.graphics);

        // Update loop
        this.app.ticker.add(this._update.bind(this));
    }

    /* --- Accessors --- */

    public get world(): TWorld {
        return this._world;
    }

    public get view(): DeepReadonly<Viewport.View> {
        return this._viewport.view;
    }

    public set view(view: Partial<Viewport.View>) {
        this._viewport.view = view;
    }

    public get viewport(): TViewport {
        return this._viewport;
    }

    public get width(): number {
        return this.app.view.width;
    }

    public get height(): number {
        return this.app.view.height;
    }

    /* --- General --- */

    /**
     * Bind the canvas to an html element.
     * This will append the canvas to that element.
     */
    public bind(element: HTMLElement) {
        // Append the canvas to the element
        element.appendChild(this.app.view as HTMLCanvasElement);

        // Set resize target
        this.app.resizeTo = element;
    }

    public destroy() {
        this.app.destroy(true, { children: true, texture: true });
    }

    public resize() {
        this.app.resize();
    }

    /* --- Drawing --- */

    public async draw(force = false) {
        await this._viewport.draw(force);
    }

    /* --- Update --- */

    /**
     * Update the canvas.
     *
     * @param delta Time since last update.
     */
    private _update(delta: number) {
        this._world.update(delta);
    }

    /* --- Utility --- */

    /**
     * Convert a point from view coordinates to world coordinates.
     */
    public viewToWorld(point: PIXI.IPointData): PIXI.IPointData {
        return this._viewport.viewToWorld(point);
    }

    /**
     * Convert a point from world coordinates to view coordinates.
     */
    public worldToView(point: PIXI.IPointData): PIXI.IPointData {
        return this._viewport.worldToView(point);
    }
}
