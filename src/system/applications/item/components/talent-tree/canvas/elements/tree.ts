import { TalentTreeItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';

// Canvas
import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';
import { TalentTreeWorld } from '../world';

// Canvas elements
import { TalentTreeNode } from './nodes';

export class TalentTreeCanvasElement extends Drawable {
    // Re-declare canvas type
    public declare readonly canvas: PIXICanvasApplication<
        typeof TalentTreeWorld
    >;

    public backgroundAlpha = 1;

    private rootNode: TalentTreeNode;
    private background = new PIXI.Sprite();

    private backgroundTexture?: PIXI.Texture;

    public constructor(
        canvas: PIXICanvasApplication,
        public readonly item: TalentTreeItem,
    ) {
        super(canvas);

        // Set background z-index
        this.background.zIndex = 0;

        // Create root node
        this.rootNode = new TalentTreeNode(
            this.canvas,
            {
                id: this.item.id,
                position: { x: 0, y: 0 },
                type: TalentTree.Node.Type.Tree,
                uuid: this.item.uuid,
                isRoot: true,
            },
            this.item,
        );

        // Add layers
        this.addChild(this.background);
        this.addChild(this.rootNode);
    }

    /* --- Accessors --- */

    public get data() {
        return this.item.system;
    }

    public get nodes() {
        return this.rootNode.nodes;
    }

    public get connections() {
        return this.rootNode.connections;
    }

    public get editable() {
        return this.canvas.world.editable;
    }

    /* --- Drawing --- */

    protected override _draw() {
        if (!this.backgroundTexture) return;

        // Set the background texture
        this.background.texture = this.backgroundTexture;

        // Set sprite position
        this.background.position.set(
            this.data.background.position.x,
            this.data.background.position.y,
        );

        // Set sprite size
        this.background.width = this.data.background.width;
        this.background.height = this.data.background.height;

        // Set sprite alpha
        this.background.alpha = this.backgroundAlpha;
    }

    /* --- Public functions --- */

    public async refresh() {
        if (
            this.data.background.img &&
            !this.backgroundTexture?.baseTexture.resource.src.endsWith(
                this.data.background.img,
            )
        ) {
            if (this.backgroundTexture) {
                // Unload the existing background texture
                this.backgroundTexture.destroy();
            }

            // Load the new background image
            this.backgroundTexture = (await loadTexture(
                this.data.background.img,
            )) as PIXI.Texture;

            // Mark as dirty to redraw
            this.markDirty();
        }

        // Refresh contents
        await this.rootNode.refresh();
    }
}
