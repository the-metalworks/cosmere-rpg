import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { CharacterActor } from '@system/documents/actor';
import { ConstructorOf } from '@system/types/utils';
import { TalentTree, Talent } from '@system/types/item';
import { NodeConnection } from './types';

// Utils
import * as TalentTreeUtils from '@system/utils/talent-tree';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { htmlStringHasContent } from '@system/utils/generic';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

// Canvas
import { PIXICanvasApplication } from '@system/applications/canvas';
import {
    GridViewport,
    TalentTreeWorld,
    CanvasElements,
    MoveNodeEvent,
    ClickNodeEvent,
    RightClickNodeEvent,
    MouseOverNodeEvent,
    MouseOutNodeEvent,
    CreateConnectionEvent,
    ClickConnectionEvent,
    RightClickConnectionEvent,
} from './canvas';

// Constants
import { SYSTEM_ID } from '@system/constants';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TalentTreeViewComponentParams = {
    tree: TalentTreeItem;
    source?: Talent.Source;
    contextActor?: CharacterActor;
    allowObtainTalents?: boolean;
};

export class TalentTreeViewComponent<
    P extends TalentTreeViewComponentParams = TalentTreeViewComponentParams,
> extends DragDropComponentMixin(HandlebarsApplicationComponent)<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    P
> {
    static emittedEvents = super.emittedEvents.concat([
        'click-node',
        'click-connection',
    ]);

    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/components/talent-tree-view.hbs';

    static DRAG_DROP = [
        {
            dropSelector: '',
        },
    ];

    static SELECTION_ENABLED = false;

    protected contextMenu?: AppContextMenu;

    protected app?: PIXICanvasApplication<
        typeof TalentTreeWorld,
        typeof GridViewport
    >;
    protected viewport?: GridViewport;
    protected canvasTree?: CanvasElements.TalentTree;

    protected _selected?: TalentTree.Node | NodeConnection;
    protected _selectedType: 'node' | 'connection' = 'node';

    protected viewPositioned = false;

    /* --- Accessors --- */

    public get tree(): TalentTreeItem {
        return this.params!.tree;
    }

    public get allowObtainTalents(): boolean {
        return this.params!.allowObtainTalents ?? false;
    }

    public get contextActor(): CharacterActor | undefined {
        return this.params!.contextActor;
    }

    public get selected(): TalentTree.Node | NodeConnection | undefined {
        return this._selected;
    }

    public get selectedType(): 'node' | 'connection' {
        return this._selectedType;
    }

    /* --- Public functions --- */

    public async resize() {
        this.app!.resize();

        this.initializeCanvasView();

        // Render canvas
        await this.canvasTree!.refresh();
        await this.renderCanvas(true);
    }

    public selectNode(node: TalentTree.Node) {
        this.deselect();
        if (
            !(this.constructor as typeof TalentTreeViewComponent)
                .SELECTION_ENABLED
        )
            return;

        this._selected = node;
        this._selectedType = 'node';

        // Select node
        this.canvasTree!.nodes!.find(
            (n) =>
                n instanceof CanvasElements.Nodes.TalentNode &&
                n.data.id === node.id,
        )?.select();

        // Render canvas
        void this.render();
        void this.renderCanvas();
    }

    public selectConnection(connection: NodeConnection) {
        // NOTE: Do nothing a tthis time
    }

    public deselect() {
        if (!this.selected) return;

        if (this.selectedType === 'node') {
            this.canvasTree!.nodes!.find(
                (n) =>
                    n instanceof CanvasElements.Nodes.TalentNode &&
                    n.data.id === (this.selected as TalentTree.Node).id,
            )?.deselect();
        } else {
            this.canvasTree!.connections!.find(
                (c) =>
                    c.from.data.id === (this.selected as NodeConnection).from &&
                    c.to.data.id === (this.selected as NodeConnection).to,
            )?.deselect();
        }

        this._selected = undefined;

        // Draw tree
        void this.render();
        void this.renderCanvas();
    }

    /* --- Lifecycle --- */

    protected _onInitialize(params: P) {
        super._onInitialize(params);

        if (this.app) return;

        // Add context menu
        this.contextMenu = AppContextMenu.create({
            parent: this as AppContextMenu.Parent,
        });

        // Create canvas application
        this.app = new PIXICanvasApplication({
            viewportClass: GridViewport,
            worldClass: TalentTreeWorld,
        });

        // Get viewport
        this.viewport = this.app.viewport;

        // Add talent tree element
        this.canvasTree = this.app.world.addChild(
            new CanvasElements.TalentTree(this.app, this.tree),
        );

        // Add listeners
        this.app.world.on('click-node', this.onClickNode.bind(this));

        this.app.world.on(
            'rightclick-node',
            (event: RightClickNodeEvent<CanvasElements.Nodes.BaseNode>) => {
                // Convert node position to view space
                const viewPos = this.viewport!.worldToView(event.node.origin);

                // Get options
                const options = [
                    ...(event.node.data.type === TalentTree.Node.Type.Talent
                        ? this.getTalentContextMenuOptions(event.node.data)
                        : []),
                    ...this.getNodeContextMenuOptions(event.node.data),
                ];
                if (options.length === 0) return;

                // Adjust size for zoom
                const size = {
                    width: event.node.size.width * this.viewport!.view.zoom,
                    height: event.node.size.height * this.viewport!.view.zoom,
                };

                // Show context menu
                void this.contextMenu!.show(options, {
                    left: viewPos.x + size.width,
                    top: viewPos.y,
                });
            },
        );

        this.app.world.on('click-connection', (event: ClickConnectionEvent) => {
            // Select
            this.selectConnection({
                from: event.from.data.id,
                to: event.to.data.id,
            });

            // Dispatch event
            this.dispatchEvent(
                new CustomEvent('click-connection', {
                    detail: {
                        connection: event.connection,
                    },
                }),
            );
        });

        this.app.world.on(
            'rightclick-connection',
            (event: RightClickConnectionEvent) => {
                // Convert canvas connection to node connection
                const connection = {
                    from: event.from.data.id,
                    to: event.to.data.id,
                };

                // Select
                this.selectConnection(connection);

                // Get options
                const options =
                    this.getConnectionContextMenuOptions(connection);
                if (options.length === 0) return;

                // Show context menu
                void this.contextMenu!.show(
                    this.getConnectionContextMenuOptions(connection),
                    {
                        left: event.screen.x,
                        top: event.screen.y,
                    },
                );
            },
        );

        this.app.world.on('node-move', (event: MoveNodeEvent) => {
            this.contextMenu!.hide();

            // Update the item
            void this.tree.update(
                {
                    [`system.nodes.${event.node.data.id}.position`]:
                        event.node.data.position,
                },
                { render: false },
            );
        });

        this.app.world.on(
            'create-connection',
            async (event: CreateConnectionEvent) => {
                this.contextMenu!.hide();

                // Create connection
                await TalentTreeUtils.addConnection(
                    event.from.data.id,
                    event.to.data.id,
                    this.tree,
                    { render: false },
                );
                await this.canvasTree!.refresh();
                void this.renderCanvas();
            },
        );

        this.app.world.on(
            'mouseover-node',
            foundry.utils.debounce(this.onMouseOverNode.bind(this), 300),
        );
        this.app.world.on(
            'mouseout-node',
            foundry.utils.debounce(this.onMouseOutNode.bind(this), 300),
        );

        this.viewport.on('mousedown', () => {
            this.contextMenu!.hide();
            this.deselect();
            void this.renderCanvas();
        });

        // Configure
        this.configureWorld();
        this.configureViewport();
    }

    protected _onDestroy(): void {
        // Teardown canvas
        this.app!.destroy();
    }

    protected _onRender(params: P) {
        super._onRender(params);

        // Get view element
        const view: HTMLElement = this.element!.querySelector('.view')!;

        // Bind the canvas to the view
        this.app!.bind(view);

        // Re-configure
        this.configureWorld();

        setTimeout(async () => {
            this.app!.resize();

            if (!this.viewPositioned) this.initializeCanvasView();

            // Render canvas
            await this.canvasTree!.refresh();
            await this.renderCanvas(true);
        });
    }

    protected configureWorld() {
        this.app!.world.editable = false;
        this.app!.world.contextActor = this.params!.contextActor;
    }

    protected configureViewport() {
        this.app!.viewport.displayGrid = false;
        this.app!.viewport.allowPan = false;
        this.app!.viewport.allowZoom = false;
    }

    protected initializeCanvasView() {
        const canvasWidth = this.app!.view.width;
        const canvasHeight = this.app!.view.height;

        // Compute new zoom level to match the stored world width and height
        const zoomX = canvasWidth / this.tree.system.viewBounds.width;
        const zoomY = canvasHeight / this.tree.system.viewBounds.height;

        // Use the smaller zoom to ensure the same content is visible
        const newZoom = Math.min(zoomX, zoomY);

        // Compute new world-space dimensions with the new zoom
        const newWorldWidth = canvasWidth / newZoom;
        const newWorldHeight = canvasHeight / newZoom;

        // Compute new top-left position so the center remains the same
        const newX = this.tree.system.viewBounds.x - newWorldWidth / 2;
        const newY = this.tree.system.viewBounds.y - newWorldHeight / 2;

        // Apply the view
        this.viewport!.view = {
            x: newX,
            y: newY,
            zoom: newZoom,
        };

        // Set flag
        this.viewPositioned = true;
    }

    /* --- Event handlers --- */

    protected async onClickNode(
        event: ClickNodeEvent<CanvasElements.Nodes.TalentNode>,
    ) {
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

        // Get the node
        const node = event.node.data as TalentTree.Node;

        if (
            !!this.contextActor &&
            this.allowObtainTalents &&
            node.type === TalentTree.Node.Type.Talent &&
            !this.contextActor.hasTalent(node.talentId) &&
            this.contextActor.hasTalentPreRequisites(node.prerequisites)
        ) {
            // Get the item
            const item = (await fromUuid(node.uuid)) as TalentItem | null;
            if (!item) return;

            // Determine the source
            const source = this.params!.source ?? {
                type: Talent.SourceType.Tree,
                id: this.tree.id,
                uuid: this.tree.uuid,
            };

            // Obtain talent
            await this.contextActor.createEmbeddedDocuments('Item', [
                foundry.utils.mergeObject(item.toObject(), {
                    flags: {
                        [SYSTEM_ID]: {
                            source: source,
                        },
                    },
                }),
            ]);

            // Notification
            ui.notifications.info(
                game.i18n!.format('GENERIC.Notification.TalentObtained', {
                    talent: item.name,
                    actor: this.contextActor.name,
                }),
            );

            // Refresh tree
            await this.canvasTree!.refresh();
            await this.renderCanvas(true);
        }
    }

    protected async onMouseOverNode(
        event: MouseOverNodeEvent<CanvasElements.Nodes.TalentNode>,
    ) {
        // Get the item
        const item = (await fromUuid(
            event.node.data.uuid,
        )) as TalentItem | null;
        if (!item) return;

        // Get the node
        const node = event.node.data;

        // Get node view position
        const viewPos = event.node.getGlobalPosition();

        // Get node size
        const nodeSize = {
            width: event.node.data.size.width * this.viewport!.view.zoom,
            height: event.node.data.size.height * this.viewport!.view.zoom,
        };

        // Render tooltip
        const contentStr = await renderSystemTemplate(
            TEMPLATES.ITEM_TALENT_TREE_NODE_TOOLTIP,
            {
                title: item.name,
                img: item.img,
                prerequisites: node.prerequisites.map((prereq) => {
                    const prereqMet = this.contextActor
                        ? TalentTreeUtils.characterMeetsPrerequisiteRule(
                              this.contextActor,
                              prereq,
                          )
                        : undefined;

                    return {
                        ...prereq,
                        met: prereqMet,
                        ...(prereq.type ===
                        TalentTree.Node.Prerequisite.Type.Talent
                            ? {
                                  talents: prereq.talents.map((ref) => ({
                                      id: ref.id,
                                      label:
                                          (
                                              fromUuidSync(ref.uuid) as
                                                  | Pick<CosmereItem, 'name'>
                                                  | undefined
                                          )?.name ?? ref.label,
                                      uuid: ref.uuid,
                                      obtained:
                                          this.contextActor?.hasTalent(
                                              ref.id,
                                          ) ?? false,
                                  })),
                              }
                            : undefined),
                    };
                }),
                description: await TextEditor.enrichHTML(
                    htmlStringHasContent(item.system.description?.short)
                        ? item.system.description!.short!
                        : htmlStringHasContent(item.system.description?.value)
                          ? item.system.description!.value!
                          : '',
                ),
                hasContextActor: !!this.contextActor,
            },
        );

        // Turn the string into an element
        const template = document.createElement('template');
        template.innerHTML = contentStr;
        const content = template.content.firstElementChild as HTMLElement;

        // Create temp element to serve as the tooltip target
        const toolTipRoot = document.createElement('div');
        toolTipRoot.style.position = 'absolute';
        toolTipRoot.style.left = viewPos.x + 'px';
        toolTipRoot.style.top = viewPos.y + 'px';
        toolTipRoot.style.width = nodeSize.width + 'px';
        toolTipRoot.style.height = nodeSize.height + 'px';
        toolTipRoot.style.pointerEvents = 'none';
        toolTipRoot.classList.add('talent-tree-tooltip-root');
        this.element!.appendChild(toolTipRoot);

        // Show tooltip
        game.tooltip!.activate(toolTipRoot, {
            content: content,
            direction: 'RIGHT',
        });
    }

    protected onMouseOutNode() {
        game.tooltip!.deactivate();

        // Remove tooltip root
        const tooltipRoot = this.element!.querySelectorAll(
            '.talent-tree-tooltip-root',
        );
        tooltipRoot.forEach((el) => el.remove());
    }

    /* --- Context --- */

    public async _prepareContext(params: P, context: never) {
        const item =
            !!this.selected && this.selectedType === 'node'
                ? ((await fromUuid(
                      (
                          this.selected as
                              | TalentTree.TalentNode
                              | TalentTree.TreeNode
                      ).uuid,
                  )) as TalentItem | TalentTreeItem | null)
                : null;

        const itemLink = item ? item.toAnchor().outerHTML : null;

        return {
            ...params,
            tree: this.tree,
            selected: this.selected,
            selectedType: this.selectedType,
            hasSelection: !!this.selected,
            item,
            itemLink,
        };
    }

    /* --- PIXI rendering --- */

    protected async renderCanvas(force?: boolean) {
        await this.app!.draw(force);
    }

    /* --- Context menu options --- */

    protected getNodeContextMenuOptions(
        node: TalentTree.Node,
    ): AppContextMenu.Item[] {
        return [];
    }

    protected getTalentContextMenuOptions(
        node: TalentTree.TalentNode,
    ): AppContextMenu.Item[] {
        return [];
    }

    protected getConnectionContextMenuOptions(
        connection: NodeConnection,
    ): AppContextMenu.Item[] {
        return [];
    }
}

// Register the component
TalentTreeViewComponent.register('app-talent-tree-view');
