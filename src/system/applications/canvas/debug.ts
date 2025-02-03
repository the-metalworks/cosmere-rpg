import { Ray } from '@system/math';

interface DrawRayConfig {
    origin: PIXI.IPointData;
    direction: PIXI.IPointData;
}

interface DrawRayOptions {
    /**
     * @default 50
     */
    length?: number;
    /**
     * @default 'white'
     */
    color?: PIXI.Color | number | string;
    /**
     * @default 1
     */
    width?: number;
}

export class CanvasDebug {
    public readonly graphics: PIXI.Graphics = new PIXI.Graphics();

    constructor() {
        this.graphics.zIndex = 1000;
    }

    public drawLine(
        origin: PIXI.IPointData,
        destination: PIXI.IPointData,
        color: PIXI.Color | number | string = 'white',
        width = 1,
    ) {
        this.graphics.lineStyle(width, color);
        this.graphics.moveTo(origin.x, origin.y);
        this.graphics.lineTo(destination.x, destination.y);
        this.graphics.moveTo(0, 0);
        this.graphics.lineStyle({
            width: 1,
            color: 0x000000,
        });
    }

    public drawRay(
        rayOrConfig: Ray | DrawRayConfig,
        options: DrawRayOptions = {},
    ) {
        // Get values
        const { origin, direction } = rayOrConfig;
        const { width = 1, color = 'white', length = 50 } = options;

        // Draw the ray
        this.graphics.lineStyle(width, color);
        this.graphics.moveTo(origin.x, origin.y);
        this.graphics.lineTo(
            origin.x + direction.x * length,
            origin.y + direction.y * length,
        );
        this.graphics.moveTo(0, 0);
        this.graphics.lineStyle({
            width: 1,
            color: 0x000000,
        });
    }

    public drawCircle(
        center: PIXI.IPointData,
        radius: number,
        color: PIXI.Color | number | string = 'white',
    ) {
        this.graphics.beginFill(color);
        this.graphics.drawCircle(center.x, center.y, radius);
        this.graphics.endFill();
    }

    public clear() {
        this.graphics.clear();
    }
}
