import { TalentTree } from '@system/types/item';
import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';

// Constants
import { GRID_SIZE } from '../../../constants';

interface NodeData {
    id: string;
    type: TalentTree.Node.Type;
    position: PIXI.IPointData;
}

export abstract class BaseNode extends Drawable {
    public selected = false;

    public constructor(
        canvas: PIXICanvasApplication,
        public readonly data: TalentTree.Node,
    ) {
        super(canvas);

        this.zIndex = 1;
        this.x = data.position.x;
        this.y = data.position.y;

        this.interactive = true;
        this.cursor = 'pointer';
    }

    /* --- Accessors --- */

    public get size() {
        return {
            width: GRID_SIZE,
            height: GRID_SIZE,
        };
    }

    public get origin(): PIXI.IPointData {
        return this.position;
    }

    /* --- Public functions --- */

    public refresh(): Promise<void> {
        this.x = this.data.position.x;
        this.y = this.data.position.y;

        return Promise.resolve();
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
