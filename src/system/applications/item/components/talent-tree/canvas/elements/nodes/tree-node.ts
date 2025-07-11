import { TalentTreeItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';

// Import base node
import { BaseNode } from './types';

// Canvas
import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';
import { TalentTreeWorld, MouseOverNodeEvent } from '../../world';
import { TalentNode } from './talent-node';
import {
    BaseConnection,
    TalentsConnection,
    NestedTreeConnection,
} from '../connection';

// Constants
import { SUB_GRID_SIZE, GRID_SIZE } from '../../../constants';

class Layer<
    T extends PIXI.DisplayObject = PIXI.DisplayObject,
> extends Drawable {
    public declare children: T[];

    public constructor(canvas: PIXICanvasApplication, zIndex: number) {
        super(canvas);

        this.zIndex = zIndex;

        this.filters = [new PIXI.ColorMatrixFilter()];
    }

    public get colorMatrixFilter() {
        return this.filters![0] as PIXI.ColorMatrixFilter;
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
                .map((child) => (child as unknown as Drawable).initialize()),
        );
    }
}

class TreeHeader extends Drawable {
    private text: PIXI.Text;

    public constructor(private readonly node: TalentTreeNode) {
        super(node.canvas);

        // Add text
        this.text = new PIXI.Text(this.node.item.name, {
            fontSize: 16,
            fill: 'white',
            fontFamily: 'Penumbra Serif Std',
            fontWeight: 'bold',
        });

        // Set text anchor
        this.text.anchor.set(0.5, 0.5);

        // Add text to the drag handle
        this.addChild(this.text);

        // Check interactivity
        if (!this.node.editable) {
            this.eventMode = 'none';
            this.cursor = 'default';
        }
    }

    public get size() {
        return {
            width: this.node.size.width,
            height: SUB_GRID_SIZE * 4,
        };
    }

    protected override _draw() {
        this.clear();

        if (this.node.isRoot) return;

        // Get size
        const size = this.size;

        // Draw drag handle
        this.beginFill('#010e2d');
        this.drawRect(
            this.node.contentBounds!.x - this.node.padding.x,
            this.node.contentBounds!.y - this.node.padding.y - size.height,
            size.width,
            size.height,
        );

        // Update text position
        this.text.position.set(
            this.node.contentBounds!.x + this.node.contentBounds!.width / 2,
            this.node.contentBounds!.y - this.node.padding.y - size.height / 2,
        );
    }
}

class TreeBackground extends Drawable {
    public constructor(private readonly node: TalentTreeNode) {
        super(node.canvas);

        // Check interactivity
        if (!this.node.editable) {
            this.eventMode = 'none';
            this.cursor = 'default';
        }
    }

    protected override _draw() {
        this.clear();

        if (this.node.isRoot) return;

        // Draw background
        this.beginFill('#111', 0.7);
        this.drawRect(
            this.node.contentBounds!.x - this.node.padding.x,
            this.node.contentBounds!.y - this.node.padding.y,
            this.node.size.width,
            this.node.size.height,
        );
        this.endFill();
    }
}

export class TalentTreeNode extends BaseNode {
    // Redeclare data type
    public declare readonly data: TalentTree.TreeNode & { isRoot?: boolean };
    public declare readonly canvas: PIXICanvasApplication<
        typeof TalentTreeWorld
    >;

    public readonly header?: TreeHeader;

    private nodesLayer;
    private connectionsLayer;

    private _contentBounds?: PIXI.Rectangle;
    private _contentOffset?: PIXI.Point;
    private _padding: PIXI.IPointData = {
        x: SUB_GRID_SIZE,
        y: SUB_GRID_SIZE,
    };

    public constructor(
        canvas: PIXICanvasApplication<typeof TalentTreeWorld>,
        data: TalentTree.TreeNode & { isRoot?: boolean },
        public readonly item: TalentTreeItem,
    ) {
        super(canvas, data);

        if (!this.isRoot) {
            this.addChild(new TreeBackground(this));
        }

        this.name = item.name;

        // Create layers
        this.nodesLayer = new Layer<BaseNode>(this.canvas, 2);
        this.connectionsLayer = new Layer<BaseConnection>(this.canvas, 1);

        // Add layers
        this.addChild(this.connectionsLayer);
        this.addChild(this.nodesLayer);

        if (!this.isRoot) {
            this.header = new TreeHeader(this);
            this.addChild(this.header);
        }
    }

    public override async _initialize() {
        await this.refresh();
    }

    /* --- Accessors --- */

    public override get size() {
        return {
            width: (this._contentBounds?.width ?? 0) + this._padding.x * 2,
            height: (this._contentBounds?.height ?? 0) + this._padding.y * 2,
        };
    }

    public override get origin() {
        // Get the content origin
        const contentOrigin = this.contentOrigin;

        return {
            x: contentOrigin.x - this._padding.x,
            y:
                contentOrigin.y -
                this._padding.y -
                (this.header?.size.height ?? 0),
        };
    }

    public get contentOrigin() {
        return {
            x: this.position.x - (this._contentOffset?.x ?? 0),
            y: this.position.y - (this._contentOffset?.y ?? 0),
        };
    }

    public get nodes() {
        return this.nodesLayer?.children as BaseNode[] | undefined;
    }

    public get connections() {
        return this.connectionsLayer?.children as BaseConnection[] | undefined;
    }

    public get isRoot(): boolean {
        return !!this.data.isRoot;
    }

    public get editable() {
        return this.canvas.world.editable;
    }

    public get contentEditable() {
        return this.editable && this.isRoot;
    }

    public get contentBounds() {
        return this._contentBounds;
    }

    public get contentOffset() {
        return this._contentOffset;
    }

    public get padding() {
        return this._padding;
    }

    public get rootTalents() {
        return this.item.system.nodes.filter(
            (node) =>
                node.type === TalentTree.Node.Type.Talent &&
                node.connections.size === 0,
        ) as TalentTree.TalentNode[];
    }

    public get isObtained() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Check if the actor has any of the root talents
        return this.rootTalents.some((talent) =>
            actor.hasTalent(talent.talentId),
        );
    }

    public get isAvailable() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Check if the actor meets the prerequisites for any of the root talents
        return this.rootTalents.some(
            (talent) =>
                !actor.hasTalent(talent.id) &&
                actor.hasTalentPreRequisites(talent.prerequisites, this.item),
        );
    }

    /* --- Drawing --- */

    protected override _draw() {
        if (this.isRoot) return;

        // Draw bounds
        this.lineStyle({
            width: 1,
            color: '#d0a552',
            alignment: 1,
        });
        this.drawRect(
            this.contentBounds!.x - SUB_GRID_SIZE,
            this.contentBounds!.y - SUB_GRID_SIZE * 5,
            this.contentBounds!.width + SUB_GRID_SIZE * 2,
            this.contentBounds!.height + SUB_GRID_SIZE * 6,
        );
    }

    /* --- Public functions --- */

    public async refresh() {
        await super.refresh();
        await this.refreshContents();

        if (this.canvas.world.editable && !this.isRoot) {
            this.nodesLayer.colorMatrixFilter.saturate(-0.5, false);
            this.connectionsLayer.colorMatrixFilter.saturate(-0.5, false);
            this.nodesLayer.colorMatrixFilter.brightness(0.75, true);
            this.connectionsLayer.colorMatrixFilter.brightness(0.75, true);
        } else {
            this.nodesLayer.colorMatrixFilter.reset();
            this.connectionsLayer.colorMatrixFilter.reset();
        }
    }

    /* --- Helpers --- */

    private async refreshContents() {
        const dataNodes = Array.from(this.item.system.nodes);

        // Check if any new nodes have been added
        const addedNodes = dataNodes
            .filter(
                (node) =>
                    !this.nodes!.some((child) => child.data.id === node.id),
            )
            .filter(
                (node) => !('uuid' in node) || fromUuidSync(node.uuid) !== null,
            );

        // Add new nodes to the canvas
        await Promise.all(
            addedNodes.map(async (node) => {
                if (node.type === TalentTree.Node.Type.Talent) {
                    this.nodesLayer.addChild(new TalentNode(this.canvas, node));
                } else if (node.type === TalentTree.Node.Type.Tree) {
                    // Get the tree item
                    const item = (await fromUuid(
                        node.uuid,
                    )) as unknown as TalentTreeItem;
                    this.nodesLayer.addChild(
                        new TalentTreeNode(this.canvas, node, item),
                    );
                }
            }),
        );

        // Check if any nodes have been removed
        const removedNodes = this.nodes!.filter(
            (child) => !dataNodes.some((node) => node.id === child.data.id),
        );

        // Remove nodes from the canvas
        removedNodes.forEach((child) => this.nodesLayer.removeChild(child));

        // Get list of all node connections
        const nodeConnections = dataNodes
            .filter((node) => node.type === TalentTree.Node.Type.Talent)
            .map((node) => {
                return node.connections.map((connection) => ({
                    fromId: node.id,
                    toId: connection.id,
                    path: connection.path,
                }));
            })
            .flat()
            .filter(({ fromId, toId }) => !!fromId && toId);

        const treeConnections = dataNodes
            .filter((node) => node.type === TalentTree.Node.Type.Tree)
            .map((dataNode) => {
                // Get the talent tree node
                const talentTreeNode = this.nodesLayer.children.find(
                    (child) => child.data.id === dataNode.id,
                ) as TalentTreeNode;

                return talentTreeNode.rootTalents
                    .filter(
                        (talentNode) =>
                            talentNode.prerequisites.size > 0 &&
                            talentNode.prerequisites.some(
                                (prereq) =>
                                    prereq.type ===
                                    TalentTree.Node.Prerequisite.Type.Talent,
                            ),
                    )
                    .map((talentNode) =>
                        talentNode.prerequisites
                            .filter(
                                (prereq) =>
                                    prereq.type ===
                                    TalentTree.Node.Prerequisite.Type.Talent,
                            )
                            .map((prereq) =>
                                prereq.talents
                                    .map((ref) => ({
                                        talentId: this.item.system.nodes.find(
                                            (n) =>
                                                n.type ===
                                                    TalentTree.Node.Type
                                                        .Talent &&
                                                n.talentId === ref.id,
                                        )?.id,
                                        treeId: dataNode.id,
                                    }))
                                    .filter((v) => !!v.talentId),
                            ),
                    )
                    .flat(2)
                    .filter(
                        (v, i, self) =>
                            self.findIndex(
                                (t) =>
                                    t.talentId === v.talentId &&
                                    t.treeId === v.treeId,
                            ) === i,
                    );
            })
            .flat(2);

        const connections = [...nodeConnections, ...treeConnections];

        // Check if any connections have been added
        const addedConnections = connections.filter(
            (connection) =>
                !this.connections!.some(
                    (child) =>
                        ('fromId' in connection &&
                            child.from.data.id === connection.fromId &&
                            child.to.data.id === connection.toId) ||
                        ('talentId' in connection &&
                            child.from.data.id === connection.treeId &&
                            child.to.data.id === connection.talentId),
                ),
        );

        // Add new connections to the canvas
        addedConnections.forEach((connection) => {
            if ('fromId' in connection) {
                // Find from and to nodes
                const from = this.nodesLayer.children.find(
                    (child) => child.data.id === connection.fromId,
                ) as TalentNode;
                const to = this.nodesLayer.children.find(
                    (child) => child.data.id === connection.toId,
                ) as TalentNode;

                // Create the connection element
                const connectionElement = new TalentsConnection(
                    this.canvas,
                    from,
                    to,
                    connection.path?.map(
                        (point) => new PIXI.Point(point.x, point.y),
                    ),
                );
                this.connectionsLayer.addChild(connectionElement);
            } else {
                // Find the talent node
                const talentNode = this.nodesLayer.children.find(
                    (child) => child.data.id === connection.talentId,
                ) as TalentNode;

                // Find the tree node
                const treeNode = this.nodesLayer.children.find(
                    (child) => child.data.id === connection.treeId,
                ) as TalentTreeNode;

                // Create the connection element
                const connectionElement = new NestedTreeConnection(
                    this.canvas,
                    treeNode,
                    talentNode,
                );
                this.connectionsLayer.addChild(connectionElement);
            }
        });

        // Check if any connections have been removed
        const removedConnections = this.connections!.filter((child) => {
            const connection = child;

            if (connection instanceof TalentsConnection) {
                // Get the from node
                const fromNode = dataNodes.find(
                    (node) => node.id === connection.from.data.id,
                );

                // Check if the from node still exists and has the connection
                return (
                    !fromNode ||
                    fromNode.type !== TalentTree.Node.Type.Talent ||
                    !fromNode.connections.some(
                        (c) => c.id === connection.to.data.id,
                    )
                );
            } else {
                // Get the from node
                const fromTreeNode = dataNodes.find(
                    (node) => node.id === connection.from.data.id,
                );

                const toTalentNode = dataNodes.find(
                    (node) => node.id === connection.to.data.id,
                );

                // Check if the from and to nodes still exist
                return (
                    !fromTreeNode ||
                    fromTreeNode.type !== TalentTree.Node.Type.Tree ||
                    !toTalentNode
                );
            }
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
        await Promise.all(this.nodes!.map((node) => node.refresh()));

        // Refresh connections
        this.connections!.forEach((connection) => connection.refresh());

        // Calculate content bounds
        this.calculateContentBounds();
    }

    private calculateContentBounds() {
        const leftMostPosition = Math.min(
            ...this.nodesLayer.children.map((node) => node.data.position.x),
        );
        const rightMostPosition = Math.max(
            ...this.nodesLayer.children.map((node) => {
                if (node instanceof TalentNode) {
                    return node.data.position.x + node.data.size.width;
                } else if (node instanceof TalentTreeNode) {
                    return node.data.position.x + node.contentBounds!.width;
                } else {
                    return 0;
                }
            }),
        );

        const topMostPosition = Math.min(
            ...this.nodesLayer.children.map((node) => node.data.position.y),
        );
        const bottomMostPosition = Math.max(
            ...this.nodesLayer.children.map((node) => {
                if (node instanceof TalentNode) {
                    return node.data.position.y + node.data.size.height;
                } else if (node instanceof TalentTreeNode) {
                    return node.data.position.y + node.contentBounds!.height;
                } else {
                    return 0;
                }
            }),
        );

        // Calculate width and height
        const width = rightMostPosition - leftMostPosition;
        const height = bottomMostPosition - topMostPosition;

        // Set content offset
        this._contentOffset = new PIXI.Point(
            -leftMostPosition,
            -topMostPosition,
        );

        // Set content bounds
        this._contentBounds = new PIXI.Rectangle(
            leftMostPosition,
            topMostPosition,
            width,
            height,
        );
    }
}
