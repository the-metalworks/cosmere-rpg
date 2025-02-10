import { Viewport, ViewportOptions, World } from '@system/applications/canvas';

import '@pixi/filter-glow';

// Constants
import { GRID_SIZE, SUB_GRID_SIZE, MIN_SUB_GRID_ZOOM } from '../constants';

interface GridViewportOptions extends ViewportOptions {
    displayGrid?: boolean;
}

export class GridViewport extends Viewport {
    private grid = new PIXI.Graphics();

    private _displayGrid = true;

    public constructor(
        app: PIXI.Application,
        world: World,
        options: GridViewportOptions = {},
    ) {
        super(app, world, options);

        this.grid.interactive = false;
        this.grid.zIndex = -10;

        // Set display grid
        this._displayGrid = options.displayGrid ?? true;

        // Remove world from viewport
        this.removeChild(world);

        // Add grid to viewport
        this.addChild(this.grid);

        // Re-add world to viewport
        this.addChild(world);

        // Draw grid initially
        this.drawGrid();
    }

    public override get view(): DeepReadonly<Viewport.View> {
        return super.view;
    }

    public override set view(view: Partial<Viewport.View>) {
        super.view = view;
        this.drawGrid();
    }

    public get displayGrid() {
        return this._displayGrid;
    }

    public set displayGrid(displayGrid: boolean) {
        this._displayGrid = displayGrid;
        this.drawGrid();
    }

    protected override _onResize() {
        super._onResize();
        this.drawGrid();
    }

    public override viewToWorld(
        point: PIXI.IPointData,
        nearestSubgrid = false,
    ): PIXI.IPointData {
        const worldPoint = super.viewToWorld(point);

        if (nearestSubgrid) {
            // Round to nearest subgrid
            worldPoint.x =
                Math.round(worldPoint.x / SUB_GRID_SIZE) * SUB_GRID_SIZE;
            worldPoint.y =
                Math.round(worldPoint.y / SUB_GRID_SIZE) * SUB_GRID_SIZE;
        }

        return worldPoint;
    }

    private drawGrid() {
        // Clear grid
        this.grid.clear();

        // Check if grid should be displayed
        if (!this._displayGrid) return;

        // Set line style
        this.grid.lineStyle({
            width: 1,
            color: '#42414d', // Light grey
            alpha: 0.2,
        });

        // Scale grid size to match zoom
        const scaledGridSize = GRID_SIZE * this.view.zoom;

        // Find view offset from grid
        const offsetX = -this.view.x % scaledGridSize;
        const offsetY = -this.view.y % scaledGridSize;

        // Draw vertical lines
        for (let x = offsetX; x < this.view.width; x += scaledGridSize) {
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, this.view.height);
        }

        // Draw horizontal lines
        for (let y = offsetY; y < this.view.height; y += scaledGridSize) {
            this.grid.moveTo(0, y);
            this.grid.lineTo(this.view.width, y);
        }

        if (this.view.zoom < MIN_SUB_GRID_ZOOM) return;

        // Set line style
        this.grid.lineStyle({
            width: 1,
            color: '#42414d', // Light grey
            alpha: 0.06,
        });

        // Scale sub grid size to match zoom
        const scaledSubGridSize = SUB_GRID_SIZE * this.view.zoom;

        // Draw vertical lines
        for (let x = offsetX; x < this.view.width; x += scaledSubGridSize) {
            if (x % scaledGridSize === 0) continue;

            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, this.view.height);
        }

        // Draw horizontal lines
        for (let y = offsetY; y < this.view.height; y += scaledSubGridSize) {
            if (y % scaledGridSize === 0) continue;

            this.grid.moveTo(0, y);
            this.grid.lineTo(this.view.width, y);
        }
    }
}
