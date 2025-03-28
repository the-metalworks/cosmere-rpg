import { PIXICanvasApplication } from './canvas';

export abstract class Drawable extends PIXI.Graphics {
    private _dirty = true;
    private _initialized = false;

    public constructor(public readonly canvas: PIXICanvasApplication) {
        super();
    }

    /* --- Accessors --- */

    public get debug() {
        return this.canvas.debug;
    }

    public get initialized() {
        return this._initialized;
    }

    public get isDirty() {
        return this._dirty;
    }

    /* --- Initialization --- */

    public async initialize(): Promise<void> {
        if (this._initialized) return;

        // Initialize children
        await Promise.all(
            this.children
                .filter((child) => child instanceof Drawable)
                .map((child) => child._initialize()),
        );

        // Perform initialization logic
        await this._initialize();

        // Mark as initialized
        this._initialized = true;
    }

    public _initialize(): Promise<void> {
        return Promise.resolve();
    }

    /* --- Update --- */

    /**
     * Updates the drawable and all of its children.
     *
     * @param delta Time since last update.
     */
    public update(delta: number) {
        // Perform update logic
        this._update(delta);

        // Update children
        this.children
            .filter((child) => child instanceof Drawable)
            .forEach((child) => child.update(delta));
    }

    /**
     * Override this function with custom update logic.
     *
     * @param delta Time since last update.
     */
    protected _update(delta: number): void {}

    /* --- Drawing --- */

    /**
     * Draws the drawable and all of its children.
     * Will only redraw if the drawable is marked as dirty, or if force is `true`.
     *
     * @param force Whether to force a redraw.
     */
    public async draw(force = false) {
        if (!this._initialized) await this.initialize();

        if (this._dirty || force) {
            // Clear the graphics
            this.clear();

            // Perform drawing logic
            this._draw();

            // Mark as clean
            this._dirty = false;
        }

        // Draw children
        await Promise.all(
            this.children
                .filter((child) => child instanceof Drawable)
                .map((child) => child.draw(force)),
        );
    }

    /**
     * Override this function with custom drawing logic.
     */
    protected _draw(): void {}

    protected markDirty() {
        this._dirty = true;

        // Mark children as dirty
        this.children
            .filter((child) => child instanceof Drawable)
            .forEach((child) => child.markDirty());
    }

    /* --- Hierarchy --- */

    /**
     * Adds one or more children to the drawable.
     *
     * @param children Children to add.
     * @returns The first child added.
     */
    public addChild<T extends PIXI.DisplayObject[]>(...children: T): T[0] {
        // Add children
        super.addChild(...children);

        // Mark as dirty
        children
            .filter((child) => child instanceof Drawable)
            .forEach((child) => child.markDirty());

        return children[0];
    }
}
