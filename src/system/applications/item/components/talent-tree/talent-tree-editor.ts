import { CosmereItem, TalentTreeItem } from '@system/documents/item';
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
import { GridViewport, TalentTreeWorld, CanvasElements } from './canvas';

// Constants
import { GRID_SIZE } from './constants';

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
                width: windowSize.width - 400,
                height: windowSize.height,
            },
        });
    }

    /* --- Public functions --- */

    public async resize() {
        // Get bounds
        const bounds = this.element!.getBoundingClientRect();

        // Set size
        this.app!.app.renderer.resize(bounds.width - 400, bounds.height);

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

        // Validate item
        if (!item?.isTalent()) return;

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

        // Refresh tree
        await this.canvasTree!.refresh();
        await this.renderCanvas();
    }

    /* --- Event handlers --- */

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
            ...super.getNodeContextMenuOptions(node),
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
            ...super.getTalentContextMenuOptions(node),
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
            ...super.getConnectionContextMenuOptions(connection),
        ];
    }
}

// Register the component
TalentTreeEditorComponent.register('app-talent-tree-editor');
