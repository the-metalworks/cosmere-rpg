import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { TalentTree, Talent } from '@system/types/item';
import { NodeConnection } from './types';

// Components
import {
    TalentTreeViewComponent,
    TalentTreeViewComponentParams,
} from './talent-tree-view';

// Utils
import * as TalentTreeUtils from '@system/utils/talent-tree';
import { AppContextMenu } from '@system/applications/utils/context-menu';

// Canvas
import {
    GridViewport,
    TalentTreeWorld,
    CanvasElements,
    ClickNodeEvent,
    RightClickNodeEvent,
    RightClickConnectionEvent,
    ClickConnectionEvent,
} from './canvas';

// Constants
import { GRID_SIZE, EDIT_MENU_WIDTH } from './constants';

export class TalentTreeEditorComponent extends TalentTreeViewComponent {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/components/talent-tree-editor.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'capture-view': this.onCaptureView,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    static SELECTION_ENABLED = true;

    /* --- Statics --- */

    private static onCaptureView(
        this: TalentTreeEditorComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        // Get the visible bounds
        const bounds = this.app!.viewport.visibleBounds;

        // Compute the center
        const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
        };

        // Get window size
        const windowSize = {
            width: this.application.position.width as number,
            height: this.application.position.height as number,
        };

        // Store the view position
        void this.tree.update({
            'system.viewBounds': {
                x: center.x,
                y: center.y,
                width: bounds.width,
                height: bounds.height,
            },
            'system.display': {
                width: windowSize.width - EDIT_MENU_WIDTH,
                height: windowSize.height,
            },
        });
    }

    /* --- Public functions --- */

    public async resize() {
        // Get bounds
        const bounds = this.element!.getBoundingClientRect();

        // Set size
        this.app!.app.renderer.resize(
            bounds.width - EDIT_MENU_WIDTH,
            bounds.height,
        );

        // Render canvas
        await this.canvasTree!.refresh();
        await this.renderCanvas(true);
    }

    /* --- Configuration --- */

    protected configureWorld(): void {
        super.configureWorld();

        this.app!.world.editable = true;
        this.canvasTree!.backgroundAlpha = 0.5;
    }

    protected configureViewport() {
        this.app!.viewport.displayGrid = true;
        this.app!.viewport.allowPan = true;
        this.app!.viewport.allowZoom = true;
    }

    /* --- Drag drop --- */

    protected _canDragDrop(selector?: string | null): boolean {
        return true;
    }

    protected async _onDrop(event: DragEvent) {
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };

        // Ensure type is correct
        if (data.type !== 'Item') return;

        // Get the item
        const item = (await fromUuid(data.uuid)) as CosmereItem | null;

        // Handle item
        if (item?.isTalent())
            await this.onDropTalent(event, item as TalentItem);
        else if (item?.isTalentTree())
            await this.onDropTalentTree(event, item as TalentTreeItem);

        // Refresh tree
        await this.canvasTree!.refresh();
        await this.renderCanvas();
    }

    protected async onDropTalent(event: DragEvent, item: TalentItem) {
        // Get the item ids for all the nodes in the tree
        const itemIds = this.tree.system.nodes
            .filter((node) => node.type === TalentTree.Node.Type.Talent)
            .map((node) => node.talentId);

        // Ensure the item isn't already present in the tree
        if (itemIds.includes(item.system.id)) {
            return ui.notifications.warn(
                game.i18n!.format('GENERIC.Warning.ItemAlreadyInTree', {
                    itemId: item.system.id,
                    name: this.tree.name,
                }),
            );
        }

        // Convert drop position to world space
        const dropPos = this.app!.viewport.viewToWorld(
            {
                x: event.offsetX - GRID_SIZE / 2,
                y: event.offsetY - GRID_SIZE / 2,
            },
            true,
        );

        // Create node
        const newNode: Omit<
            TalentTree.TalentNode,
            'connections' | 'prerequisites' | 'prerequisitesMet'
        > = {
            id: foundry.utils.randomID(),
            type: TalentTree.Node.Type.Talent,
            position: dropPos,
            talentId: item.system.id,
            uuid: item.uuid,
            size: {
                width: GRID_SIZE,
                height: GRID_SIZE,
            },
            showName: false,
        };

        // Add node to tree
        await TalentTreeUtils.addNode(newNode, this.tree, { render: false });
    }

    protected async onDropTalentTree(event: DragEvent, item: TalentTreeItem) {
        // Get the talent tree uuids for all the nodes in the tree
        const treeUuids = this.tree.system.nodes
            .filter((node) => node.type === TalentTree.Node.Type.Tree)
            .map((node) => node.uuid);

        // Ensure the item isn't already present in the tree
        if (treeUuids.includes(item.uuid)) {
            return ui.notifications.warn(
                game.i18n!.format('GENERIC.Warning.ItemAlreadyInTree', {
                    itemId: item.uuid,
                    name: this.tree.name,
                }),
            );
        }

        // Convert drop position to world space
        const dropPos = this.app!.viewport.viewToWorld(
            {
                x: event.offsetX - GRID_SIZE / 2,
                y: event.offsetY - GRID_SIZE / 2,
            },
            true,
        );

        // Create node
        const newNode: TalentTree.TreeNode = {
            id: foundry.utils.randomID(),
            type: TalentTree.Node.Type.Tree,
            position: dropPos,
            uuid: item.uuid,
        };

        // Add node to tree
        await TalentTreeUtils.addNode(newNode, this.tree, { render: false });
    }

    /* --- Event handlers --- */

    protected onClickNode(
        event: ClickNodeEvent<CanvasElements.Nodes.TalentNode>,
    ): Promise<void> {
        this.contextMenu!.hide();

        // Select
        this.selectNode(event.node.data);

        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('click-node', {
                detail: {
                    node: event.node,
                },
            }),
        );

        return Promise.resolve();
    }

    protected async onRightClickNode(
        event: RightClickNodeEvent<CanvasElements.Nodes.TalentNode>,
    ) {
        this.contextMenu!.hide();

        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('rightclick-node', {
                detail: {
                    node: event.node,
                },
            }),
        );

        // Show context menu
        const options = [
            ...(event.node.data.type === TalentTree.Node.Type.Talent
                ? this.getTalentContextMenuOptions(event.node.data)
                : []),
            ...this.getNodeContextMenuOptions(event.node.data),
        ];
        if (options.length === 0) return;

        // Convert node position to view space
        const viewPos = this.viewport!.worldToView(event.node.origin);

        // Adjust size for zoom
        const size = {
            width: event.node.size.width * this.viewport!.view.zoom,
            height: event.node.size.height * this.viewport!.view.zoom,
        };

        // Show context menu
        await this.contextMenu!.show(options, {
            left: viewPos.x + size.width,
            top: viewPos.y,
        });
    }

    protected onClickConnection(event: ClickConnectionEvent): void {
        super.onClickConnection(event);

        // Select
        this.selectConnection({
            from: event.from.data.id,
            to: event.to.data.id,
        });
    }

    protected onRightClickConnection(event: RightClickConnectionEvent): void {
        // Convert canvas connection to node connection
        const connection = {
            from: event.from.data.id,
            to: event.to.data.id,
        };

        // Select
        this.selectConnection(connection);

        // Get options
        const options = this.getConnectionContextMenuOptions(connection);
        if (options.length === 0) return;

        // Show context menu
        void this.contextMenu!.show(
            this.getConnectionContextMenuOptions(connection),
            {
                left: event.screen.x,
                top: event.screen.y,
            },
        );
    }

    protected onMouseOverNode(): Promise<void> {
        return Promise.resolve();
    }

    protected onMouseOutNode(): void {
        return;
    }

    /* --- Context --- */

    public async _prepareContext(
        params: TalentTreeViewComponentParams,
        context: never,
    ) {
        return {
            ...(await super._prepareContext(params, context)),
            documentSchema: this.tree.schema,
            systemSchema: this.tree.system.schema,
        };
    }

    /* --- Context menu options --- */

    protected getNodeContextMenuOptions(
        node: TalentTree.Node,
    ): AppContextMenu.Item[] {
        return [
            {
                icon: 'fas fa-trash',
                name: 'Delete',
                callback: async () => {
                    this._selected = undefined;
                    await TalentTreeUtils.removeNode(node, this.tree, {
                        render: false,
                    });
                    await this.canvasTree!.refresh();
                },
            },
        ];
    }

    protected getTalentContextMenuOptions(
        node: TalentTree.TalentNode,
    ): AppContextMenu.Item[] {
        return [
            {
                icon: 'fas fa-edit',
                name: 'Edit',
                callback: async () => {
                    // Get the item
                    const item = (await fromUuid(
                        node.uuid,
                    )) as CosmereItem | null;

                    // Show item sheet
                    void item?.sheet?.render(true);
                },
            },
            {
                icon: 'fas fa-plus',
                name: 'Add Connection',
                callback: () => {
                    this.app!.world.beginCreateConnection(node);
                },
            },
        ];
    }

    protected getConnectionContextMenuOptions(
        connection: NodeConnection,
    ): AppContextMenu.Item[] {
        return [
            {
                icon: 'fas fa-trash',
                name: 'Delete',
                callback: async () => {
                    this._selected = undefined;
                    await TalentTreeUtils.removeConnection(
                        connection.from,
                        connection.to,
                        this.tree,
                        { render: false },
                    );
                    await this.canvasTree!.refresh();
                },
            },
        ];
    }
}

// Register the component
TalentTreeEditorComponent.register('app-talent-tree-editor');
