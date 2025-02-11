import { TalentTreeItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';
import { TalentTreeItemData } from '@system/data/item/talent-tree';

// Canvas
import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';
import { TalentTreeWorld } from '../world';

// Canvas elements
import { BaseNode, TalentNode } from './nodes';
import { Connection } from './connection';

// Constants
import { SUB_GRID_SIZE } from '../../constants';

class Layer extends Drawable {
    public constructor(canvas: PIXICanvasApplication, zIndex: number) {
        super(canvas);

        this.zIndex = zIndex;
    }

    /**
     * Initializes any uninitialized children.
     */
    public async initializeChildren() {
        await Promise.all(
            this.children
                .filter(
                    (child) => child instanceof Drawable && !child.initialized,
                )
                .map((child) => (child as Drawable).initialize()),
        );
    }
}

export class TalentTreeCanvasElement extends Drawable {
    // Re-declare canvas type
    public declare readonly canvas: PIXICanvasApplication<
        typeof TalentTreeWorld
    >;

    public backgroundAlpha = 0.75;

    private nodesLayer;
    private connectionsLayer;
    private background = new PIXI.Sprite();

    private backgroundTexture?: PIXI.Texture;

    public constructor(
        canvas: PIXICanvasApplication,
        private readonly item: TalentTreeItem,
    ) {
        super(canvas);

        // Create layers
        this.nodesLayer = new Layer(this.canvas, 2);
        this.connectionsLayer = new Layer(this.canvas, 1);

        // Set background z-index
        this.background.zIndex = 0;

        // Add layers
        this.addChild(this.background);
        this.addChild(this.connectionsLayer);
        this.addChild(this.nodesLayer);
    }

    public override async _initialize() {
        await this.refreshContents();
    }

    /* --- Accessors --- */

    public get data() {
        return this.item.system;
    }

    public get nodes() {
        return this.nodesLayer.children as BaseNode[];
    }

    public get connections() {
        return this.connectionsLayer.children as Connection[];
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
        await this.refreshContents();
    }

    /* --- Helpers --- */

    private async refreshContents() {
        const dataNodes = Array.from(this.data.nodes);

        // Check if any new nodes have been added
        const addedNodes = dataNodes
            .filter((node) => node.type === TalentTree.Node.Type.Talent)
            .filter(
                (node) =>
                    !this.nodes.some(
                        (child) =>
                            child instanceof TalentNode &&
                            child.data.id === node.id,
                    ),
            );

        // Add new nodes to the canvas
        addedNodes.forEach((node) => {
            // Create the node element
            const nodeElement = new TalentNode(this.canvas, node);
            this.nodesLayer.addChild(nodeElement);
        });

        // Check if any nodes have been removed
        const removedNodes = this.nodes
            .filter((child) => child instanceof TalentNode)
            .filter(
                (child) => !dataNodes.some((node) => node.id === child.data.id),
            );

        // Remove nodes from the canvas
        removedNodes.forEach((child) => this.nodesLayer.removeChild(child));

        // Check if any connections have been added
        const addedConnections = dataNodes
            .filter((node) => node.type === TalentTree.Node.Type.Talent)
            .map((node) => {
                return node.connections.map((connection) => ({
                    from: node,
                    to: dataNodes.find(
                        (n) => n.id === connection.id,
                    ) as TalentTree.TalentNode,
                    path: connection.path,
                }));
            })
            .flat()
            .filter(({ from, to }) => !!from && to)
            .filter(
                (connection) =>
                    !this.connections.some(
                        (child) =>
                            child.from.id === connection.from.id &&
                            child.to.id === connection.to.id,
                    ),
            );

        // Add new connections to the canvas
        addedConnections.forEach((connection) => {
            // Create the connection element
            const connectionElement = new Connection(
                this.canvas,
                connection.from,
                connection.to,
                connection.path?.map(
                    (point) => new PIXI.Point(point.x, point.y),
                ),
            );
            this.connectionsLayer.addChild(connectionElement);
        });

        // Check if any connections have been removed
        const removedConnections = this.connections.filter((child) => {
            const connection = child;

            // Get the from node
            const fromNode = dataNodes.find(
                (node) => node.id === connection.from.id,
            );

            // Check if the from node still exists and has the connection
            return (
                !fromNode ||
                fromNode.type !== TalentTree.Node.Type.Talent ||
                !fromNode.connections.some((c) => c.id === connection.to.id)
            );
        });

        // Remove connections from the canvas
        removedConnections.forEach((child) =>
            this.connectionsLayer.removeChild(child),
        );

        const contentsChanged =
            addedNodes.length > 0 ||
            removedNodes.length > 0 ||
            addedConnections.length > 0 ||
            removedConnections.length > 0;

        if (contentsChanged) {
            // Initialize children
            await this.nodesLayer.initializeChildren();
        }

        // Refresh nodes
        this.nodes.forEach((node) => node.refresh());

        // Refresh connections
        this.connections.forEach((connection) => connection.refresh());
    }
}
