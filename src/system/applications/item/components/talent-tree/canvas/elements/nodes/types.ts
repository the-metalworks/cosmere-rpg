import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';

interface NodeData {
    id: string;
    position: PIXI.IPointData;
}

export abstract class BaseNode extends Drawable {
    public selected = false;

    public constructor(
        canvas: PIXICanvasApplication,
        public readonly data: NodeData,
    ) {
        super(canvas);

        this.zIndex = 1;
        this.x = data.position.x;
        this.y = data.position.y;

        this.interactive = true;
        this.cursor = 'pointer';
    }

    public refresh() {
        this.x = this.data.position.x;
        this.y = this.data.position.y;
    }

    public select() {
        this.selected = true;
        this.markDirty();
    }

    public deselect() {
        this.selected = false;
        this.markDirty();
    }
}
