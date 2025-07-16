import {
    CosmereItem,
    RelationshipsItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { CharacterActor } from '@system/documents/actor';
import { ItemRelationship } from '@system/data/item/mixins/relationships';
import { ConstructorOf } from '@system/types/utils';
import { TalentTree } from '@system/types/item';
import { NodeConnection } from './types';

// Utils
import * as TalentTreeUtils from '@system/utils/talent-tree';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { htmlStringHasContent, debounce } from '@system/utils/generic';
import ItemRelationshipUtils from '@system/utils/item/relationship';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

// Canvas
import { PIXICanvasApplication, Viewport } from '@system/applications/canvas';
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
    parent?: RelationshipsItem;
    contextActor?: CharacterActor;
    allowObtainTalents?: boolean;
    allowPan?: boolean;
    allowZoom?: boolean;
    view?: Omit<Partial<Viewport.View>, 'width' | 'height'>;
    boundView?: boolean;
};

export class TalentTreeViewComponent<
    P extends TalentTreeViewComponentParams = TalentTreeViewComponentParams,
> extends DragDropComponentMixin(HandlebarsApplicationComponent)<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    P
> {
    static emittedEvents = super.emittedEvents.concat([
        'click-node',
        'rightclick-node',
        'click-connection',
        'rightclick-connection',
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

    // protected viewPositioned = false;
    protected shouldPositionView = true;
    protected prevSetView?: Omit<Partial<Viewport.View>, 'width' | 'height'>;

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

    public get allowPan(): boolean {
        return this.params!.allowPan ?? false;
    }

    public get allowZoom(): boolean {
        return this.params!.allowZoom ?? false;
    }

    public get boundView(): boolean {
        return this.params!.boundView ?? false;
    }

    /* --- Public functions --- */

    public async resize() {
        this.app!.resize();

        this.positionCanvasView();

        // Render canvas
        await this.canvasTree!.refresh();
        await this.renderCanvas(true);
    }

    public async setView(
        view: Omit<Partial<Viewport.View>, 'width' | 'height'>,
        bounds = this.boundView,
        render = true,
    ) {
        if (!this.viewport) return;

        // Clear the view bounds to allow for setting the view regardless of previous bounds
        this.viewport.viewBounds = undefined;

        // Set view
        this.viewport.view = foundry.utils.mergeObject(
            this.viewport.view,
            view,
        );

        this.shouldPositionView = false;

        if (bounds) {
            // Set view bounds
            this.viewport.viewBounds = {
                x: this.viewport.view.x / this.viewport.view.zoom,
                y: this.viewport.view.y / this.viewport.view.zoom,
                width: this.viewport.view.width / this.viewport.view.zoom,
                height: this.viewport.view.height / this.viewport.view.zoom,
            };
        }

        // Render canvas
        if (render) {
            await this.canvasTree!.refresh();
            await this.renderCanvas(true);
        }

        // Store the view
        this.prevSetView = view;
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
        this.app.world.on('click-node', debounce(this.onClickNode.bind(this), 300, true));
        this.app.world.on('rightclick-node', debounce(this.onRightClickNode.bind(this), 300, true));

        this.app.world.on(
            'click-connection',
            this.onClickConnection.bind(this),
        );
        this.app.world.on(
            'rightclick-connection',
            this.onRightClickConnection.bind(this),
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
            debounce(this.onMouseOverNode.bind(this), 300, true),
        );
        this.app.world.on(
            'mouseout-node',
            debounce(this.onMouseOutNode.bind(this), 300, true),
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

        this.shouldPositionView ||=
            (this.params!.view !== undefined &&
                Object.keys(this.params!.view).length > 0 &&
                (!this.prevSetView ||
                    !foundry.utils.objectsEqual(
                        this.prevSetView,
                        this.params!.view,
                    ))) ||
            (!this.params!.view && !!this.prevSetView);

        setTimeout(async () => {
            this.app!.resize();

            if (this.shouldPositionView) this.positionCanvasView();

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
        this.app!.viewport.allowPan = this.allowPan;
        this.app!.viewport.allowZoom = this.allowZoom;

        if (this.boundView)
            this.app!.viewport.viewBounds = this.tree.system.viewBounds;
    }

    protected positionCanvasView() {
        if (this.params!.view && Object.keys(this.params!.view).length > 0) {
            // If a view is provided, use it
            void this.setView(this.params!.view, this.boundView, false);
        } else {
            const canvasWidth = this.app!.view.width;
            const canvasHeight = this.app!.view.height;

            // Compute new zoom level to match the stored world width and height
            const zoomX = canvasWidth / this.tree.system.viewBounds.width;
            const zoomY = canvasHeight / this.tree.system.viewBounds.height;

            // Use the smaller zoom to ensure the same content is visible
            const newZoom = Math.min(zoomX, zoomY);

            // Compute new top-left position so the center remains the same
            const centerOffsetX = this.tree.system.viewBounds.width / 2;
            const centerOffsetY = this.tree.system.viewBounds.height / 2;

            const cornerX = this.tree.system.viewBounds.x - centerOffsetX;
            const cornerY = this.tree.system.viewBounds.y - centerOffsetY;

            const newX = cornerX * newZoom;
            const newY = cornerY * newZoom;

            // Set the view
            void this.setView(
                {
                    x: newX,
                    y: newY,
                    zoom: newZoom,
                },
                this.boundView,
                false,
            );
        }
    }

    /* --- Event handlers --- */

    protected async onClickNode(
        event: ClickNodeEvent<CanvasElements.Nodes.TalentNode>,
    ) {
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
            this.contextActor.hasTalentPreRequisites(
                node.prerequisites,
                this.tree,
            )
        ) {
            // Get the item
            const item = (await fromUuid(node.uuid)) as TalentItem | null;
            if (!item) return;

            const itemData = item.toObject();

            // Determine the parent (if any)
            const relParent = this.params!.parent;
            if (relParent) {
                ItemRelationshipUtils.addRelationshipData(
                    itemData,
                    relParent,
                    ItemRelationship.Type.Parent,
                );
            }

            // Obtain talent
            await this.contextActor.createEmbeddedDocuments('Item', [itemData]);

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

    protected async onRightClickNode(
        event: RightClickNodeEvent<CanvasElements.Nodes.TalentNode>,
    ) {
        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('rightclick-node', {
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
            this.contextActor.hasTalent(node.talentId)
        ) {
            // Find the talent on the actor
            const talent = this.contextActor.items.find(
                (item) => item.isTalent() && item.system.id === node.talentId,
            )!;

            // Check if the talent is removable
            if (
                await TalentTreeUtils.isTalentRequiredAsPrerequisite(
                    this.contextActor,
                    node.talentId,
                    this.tree,
                )
            ) {
                ui.notifications.warn(
                    game.i18n!.format(
                        'GENERIC.Notification.TalentCannotBeRemoved',
                        {
                            talent: talent.name,
                            actor: this.contextActor.name,
                        },
                    ),
                );
                return;
            }

            // Remove the talent
            await talent.delete();

            // Notification
            ui.notifications.info(
                game.i18n!.format('GENERIC.Notification.TalentRemoved', {
                    talent: talent.name,
                    actor: this.contextActor.name,
                }),
            );

            // Refresh tree
            await this.canvasTree!.refresh();
            await this.renderCanvas(true);
        }
    }

    protected onClickConnection(event: ClickConnectionEvent) {
        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('click-connection', {
                detail: {
                    connection: event.connection,
                },
            }),
        );
    }

    protected onRightClickConnection(event: RightClickConnectionEvent) {
        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('rightclick-connection', {
                detail: {
                    connection: event.connection,
                },
            }),
        );
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
                              this.tree,
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
                        ...(prereq.type ===
                        TalentTree.Node.Prerequisite.Type.Goal
                            ? {
                                  goals: prereq.goals.map((ref) => ({
                                      id: ref.id,
                                      label:
                                          (
                                              fromUuidSync(ref.uuid) as
                                                  | Pick<CosmereItem, 'name'>
                                                  | undefined
                                          )?.name ?? ref.label,
                                      uuid: ref.uuid,
                                      completed:
                                          this.contextActor?.hasCompletedGoal(
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
}

// Register the component
TalentTreeViewComponent.register('app-talent-tree-view');
