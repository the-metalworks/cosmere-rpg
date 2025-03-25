// Documents
import { CharacterActor } from '@system/documents/actor';

// Canvas
import { PIXICanvasApplication, World } from '@system/applications/canvas';

// Types
import { TalentTree } from '@system/types/item';

// Elements
import * as CanvasElements from './elements';

// Constants
import { GRID_SIZE, SUB_GRID_SIZE } from '../constants';

type InteractionState = 'none' | 'drag' | 'create-connection';

/**
 * NOTE: Declare empty interfaces here to allow for future extension
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface NodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> {
    node: Node;
}
export interface MoveNodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> extends NodeEvent<Node> {}
export interface ClickNodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> extends NodeEvent<Node> {}
export interface RightClickNodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> extends NodeEvent<Node> {}
export interface MouseOverNodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> extends NodeEvent<Node> {
    position: PIXI.IPointData;
}
export interface MouseOutNodeEvent<
    Node extends CanvasElements.Nodes.BaseNode = CanvasElements.Nodes.BaseNode,
> extends NodeEvent<Node> {}

export interface ConnectionEvent {
    connection: CanvasElements.BaseConnection;
    from: CanvasElements.Nodes.TalentNode;
    to: CanvasElements.Nodes.TalentNode;
}
export interface CreateConnectionEvent
    extends Omit<ConnectionEvent, 'connection'> {}
export interface ClickConnectionEvent
    extends ConnectionEvent,
        PIXI.FederatedMouseEvent {}
export interface RightClickConnectionEvent
    extends ConnectionEvent,
        PIXI.FederatedMouseEvent {}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export class TalentTreeWorld extends World {
    public editable = false;
    public contextActor?: CharacterActor;

    private interactionState: InteractionState = 'none';

    private contextElement?: CanvasElements.Nodes.BaseNode;
    private dragOffset?: PIXI.IPointData;

    public constructor(canvas: PIXICanvasApplication) {
        super(canvas);

        this.eventMode = 'static';

        this.on('mousemove', (event) => {
            this.onMouseMove(event);
        });

        this.on('mousedown', (event) => {
            if (event.target instanceof CanvasElements.Nodes.BaseNode) {
                this.onMouseDownNode(event);
            }
        });

        this.on('mouseup', (event) => {
            this.onMouseUp();
        });

        this.on('click', (event) => {
            if (event.target instanceof CanvasElements.Nodes.BaseNode) {
                this.onClickNode(event);
            } else if (event.target instanceof CanvasElements.BaseConnection) {
                this.onClickConnection(event);
            }
        });

        this.on('rightclick', (event) => {
            if (event.target instanceof CanvasElements.Nodes.BaseNode) {
                this.onRightClickNode(event);
            } else if (event.target instanceof CanvasElements.BaseConnection) {
                this.onRightClickConnection(event);
            }
        });

        this.on('mouseover', (event) => {
            if (event.target instanceof CanvasElements.Nodes.BaseNode) {
                this.onMouseOverNode(event);
            }
        });

        this.on('mouseout', (event) => {
            if (event.target instanceof CanvasElements.Nodes.BaseNode) {
                this.onMouseOutNode(event);
            }
        });
    }

    /* --- Accessors --- */

    public get tree(): CanvasElements.TalentTree {
        return this.children.find(
            (child) => child instanceof CanvasElements.TalentTree,
        )!;
    }

    /* --- Public functions --- */

    public beginCreateConnection(from: TalentTree.TalentNode) {
        if (!this.editable) return;
        if (this.interactionState !== 'none') return;

        // Find the node
        const node = this.tree.nodes!.find((n) => n.data === from)!;

        this.interactionState = 'create-connection';
        this.contextElement = node;
    }

    /* --- Event handlers --- */

    private onMouseMove(event: PIXI.FederatedPointerEvent) {
        if (this.interactionState !== 'drag') return;

        // Convert screen coordinates to world coordinates
        const position = this.canvas.viewToWorld(event.screen);

        // Apply the offset
        position.x -= this.dragOffset!.x;
        position.y -= this.dragOffset!.y;

        // Clamp the position to the sub-grid
        const x = Math.round(position.x / SUB_GRID_SIZE) * SUB_GRID_SIZE;
        const y = Math.round(position.y / SUB_GRID_SIZE) * SUB_GRID_SIZE;

        // Set the position
        this.contextElement!.data.position = { x, y };
        this.contextElement!.x = x;
        this.contextElement!.y = y;
    }

    private onMouseUp() {
        if (this.interactionState === 'drag') {
            // Dispatch event
            this.emit('node-move', { node: this.contextElement! });

            // Refresh
            void this.tree.refresh();

            // Reset interaction state
            this.interactionState = 'none';
            this.contextElement = undefined;
        }
    }

    private onMouseDownNode(event: PIXI.FederatedMouseEvent) {
        if (!this.editable) return;
        if (this.interactionState !== 'none') return;

        // Stop event propagation
        event.stopPropagation();

        // Set interaction state
        this.interactionState = 'drag';
        this.contextElement = event.target as CanvasElements.Nodes.BaseNode;

        // Get world space mouse position
        const mousePos = this.canvas.viewToWorld(event.screen);

        // Calculate drag offset
        this.dragOffset = {
            x: mousePos.x - this.contextElement.position.x,
            y: mousePos.y - this.contextElement.position.y,
        };
    }

    private onClickNode(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState === 'none') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Dispatch event
            this.emit('click-node', {
                node: event.target as CanvasElements.Nodes.BaseNode,
            });
        } else if (this.interactionState === 'create-connection') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Get the node
            const node = event.target as CanvasElements.Nodes.BaseNode;

            // Ensure node is talent node and not the same as the context node
            if (
                node instanceof CanvasElements.Nodes.TalentNode &&
                node !== this.contextElement
            ) {
                // Dispatch event
                this.emit('create-connection', {
                    from: this.contextElement!,
                    to: node,
                });

                // Reset interaction state
                this.interactionState = 'none';
                this.contextElement = undefined;
                node.highlighted = false;
            }
        }
    }

    private onClickConnection(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState !== 'none') return;

        // Prevent the event from bubbling up
        event.stopPropagation();

        const connection = event.target as CanvasElements.BaseConnection;

        // Dispatch event
        this.emit('click-connection', {
            connection,
            from: connection.from,
            to: connection.to,
        });
    }

    private onRightClickNode(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState !== 'none') return;

        // Prevent the event from bubbling up
        event.stopPropagation();

        // Dispatch event
        this.emit('rightclick-node', {
            ...event,
            node: event.target as CanvasElements.Nodes.BaseNode,
        });
    }

    private onRightClickConnection(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState !== 'none') return;

        // Prevent the event from bubbling up
        event.stopPropagation();

        const connection = event.target as CanvasElements.BaseConnection;

        // Dispatch event
        this.emit('rightclick-connection', {
            ...event,
            connection,
            from: connection.from,
            to: connection.to,
        });
    }

    private onMouseOverNode(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState === 'none') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Dispatch event
            this.emit('mouseover-node', {
                node: event.target as CanvasElements.Nodes.BaseNode,
            });
        } else if (this.interactionState === 'create-connection') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Get the node
            const node = event.target as CanvasElements.Nodes.BaseNode;

            // Ensure node is talent node and not the same as the context node
            if (
                node instanceof CanvasElements.Nodes.TalentNode &&
                node !== this.contextElement
            ) {
                // Highlight the node
                node.highlighted = true;
            }
        }
    }

    private onMouseOutNode(event: PIXI.FederatedMouseEvent) {
        if (this.interactionState === 'none') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Dispatch event
            this.emit('mouseout-node', {
                node: event.target as CanvasElements.Nodes.BaseNode,
            });
        } else if (this.interactionState === 'create-connection') {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Get the node
            const node = event.target as CanvasElements.Nodes.BaseNode;

            // Ensure node is talent node and not the same as the context node
            if (
                node instanceof CanvasElements.Nodes.TalentNode &&
                node !== this.contextElement
            ) {
                // Unhighlight the node
                node.highlighted = false;
            }
        }
    }
}
