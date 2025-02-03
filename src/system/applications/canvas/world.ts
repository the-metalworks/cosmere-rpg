import { PIXICanvasApplication } from './canvas';
import { Drawable } from './drawable';

export class World extends Drawable {
    public constructor(canvas: unknown) {
        super(canvas as PIXICanvasApplication);

        // Set hit area
        this.hitArea = new PIXI.Polygon(
            new PIXI.Point(-Number.MAX_VALUE, -Number.MAX_VALUE),
            new PIXI.Point(Number.MAX_VALUE, -Number.MAX_VALUE),
            new PIXI.Point(Number.MAX_VALUE, Number.MAX_VALUE),
            new PIXI.Point(-Number.MAX_VALUE, Number.MAX_VALUE),
        );
    }
}
