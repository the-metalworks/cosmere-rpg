import { TalentTree } from '@system/types/item';

import { TalentTreeItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { AnyObject, DeepPartial, MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';
import { EditModeApplicationMixin } from '../mixins';

// Components
import { TalentTreeViewComponent } from './components/talent-tree/talent-tree-view';

// AppV2
const { ItemSheetV2 } = foundry.applications.sheets;

// Constants
import { EDIT_MENU_WIDTH } from './components/talent-tree/constants';
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 650;

export class TalentTreeItemSheet extends EditModeApplicationMixin(
    ComponentHandlebarsApplicationMixin(ItemSheetV2),
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'talent-tree'],
            window: {
                positioned: true,
                resizable: true,
            },
            actions: {
                // configure: this.onConfigure,
            },
            form: {
                handler: this.onFormEvent,
                submitOnChange: true,
            } as unknown,
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            'sheet-content': {
                template:
                    'systems/cosmere-rpg/templates/item/talent-tree/parts/sheet-content.hbs',
            },
        },
    );

    private _contextActor?: CosmereActor;
    private prevWidth = 0;
    private prevHeight = 0;

    constructor(
        options: foundry.applications.api.DocumentSheetV2.Configuration,
    ) {
        const tree = options.document as unknown as TalentTreeItem;
        const mode = tree.getFlag(SYSTEM_ID, 'sheet.mode') ?? 'view';

        // Override options
        options = foundry.utils.mergeObject(options, {
            window: {
                title: tree.name,
            },
            position: {
                width:
                    (tree.system.display.width ?? DEFAULT_WIDTH) +
                    (mode === 'edit' ? EDIT_MENU_WIDTH : 0),
                height: tree.system.display.height ?? DEFAULT_HEIGHT,
            },
        });

        // Call parent constructor
        super(options);

        // Get all characters owned by the current user
        const characters = (game.actors as CosmereActor[]).filter(
            (actor) =>
                actor.isCharacter() &&
                actor.testUserPermission(
                    game.user as unknown as foundry.documents.BaseUser,
                    'OWNER',
                ),
        );

        // Get user character
        const userCharacter = game.user!.character as CosmereActor | undefined;

        if (userCharacter || characters.length === 1)
            this._contextActor = userCharacter ?? characters[0];

        // Assign previous width and height
        this.prevWidth = options.position.width as number;
        this.prevHeight = options.position.height as number;
    }

    /* --- Form --- */

    protected static async onFormEvent(
        this: TalentTreeItemSheet,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;
        if (!('name' in event.target!)) return;

        if (
            'system.background.img' in formData.object &&
            formData.object['system.background.img'] !==
                this.item.system.background.img
        ) {
            const texture = (await loadTexture(
                formData.object['system.background.img'] as string,
            )) as PIXI.Texture | null;
            if (texture) {
                // Set width and height
                formData.set('system.background.width', texture.width);
                formData.set('system.background.height', texture.height);
            }
        }

        if (
            'node.position.x' in formData.object ||
            'node.position.y' in formData.object
        ) {
            const posX = formData.get('node.position.x') as number | null;
            const posY = formData.get('node.position.y') as number | null;

            // Remove
            formData.delete('node.position.x');
            formData.delete('node.position.y');

            // Get selected node
            const selected = this.talentTreeViewComponent
                .selected as TalentTree.TalentNode;

            // Add updates
            formData.set(`system.nodes.${selected.id}.position.x`, posX);
            formData.set(`system.nodes.${selected.id}.position.y`, posY);
        }

        // Update the document
        void this.item.update(formData.object);
    }

    /* --- Accessors --- */

    get item(): TalentTreeItem {
        return super.document;
    }

    public get contextActor(): CosmereActor | undefined {
        return this._contextActor;
    }

    private get talentTreeViewComponent() {
        return Object.values(this.components).find(
            (component) => component instanceof TalentTreeViewComponent,
        )!;
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject) {
        super._onRender(context, options);
        $(this.element)
            .find('.collapsible .header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    protected override async _renderFrame(
        options: AnyObject,
    ): Promise<HTMLElement> {
        const frame = await super._renderFrame(options);

        // Get all characters owned by the current user
        const characters = (game.actors as CosmereActor[]).filter(
            (actor) =>
                actor.isCharacter() &&
                actor.testUserPermission(
                    game.user as unknown as foundry.documents.BaseUser,
                    'OWNER',
                ),
        );

        // Get user character
        const userCharacter = game.user!.character as CosmereActor | undefined;

        if (characters.length > 1) {
            $(this.window.title!).after(`
                <div class="actor-select">
                    <label>${game.i18n!.localize('Actor')}</label>
                    <select>
                        <option value="none" ${!userCharacter ? 'selected' : ''}>${game.i18n!.localize('GENERIC.None')}</option>
                        ${characters
                            .map(
                                (actor) => `
                                <option value="${actor.id}" ${userCharacter?.id === actor.id ? 'selected' : ''}>
                                    ${actor.name}
                                </option>
                            `,
                            )
                            .join('\n')}
                    </select>
                </div>
            `);
        }

        // Bind to select
        $(this.window.title!)
            .parent()
            .find('.actor-select select')
            .on('change', (event) => {
                // Get selected actor
                const actorId = $(event.target).val() as string;

                // Get actor
                const actor =
                    actorId === 'none'
                        ? undefined
                        : (game.actors as Collection<CosmereActor>).get(
                              actorId,
                          );

                // Set context actor
                this._contextActor = actor;

                // Render
                void this.render(true);
            });

        if (this.contextActor) {
            $(frame).addClass('actor-selected');
        }

        return frame;
    }

    protected _onPosition(options: unknown): void {
        super._onPosition(options);

        // Check if size has changed
        const sizeChanged =
            this.prevWidth !== this.position.width ||
            this.prevHeight !== this.position.height;
        if (!sizeChanged) return;

        // Update previous width and height
        this.prevWidth = this.position.width as number;
        this.prevHeight = this.position.height as number;

        // Resize
        void this.talentTreeViewComponent.resize();
    }

    protected _onModeChange(): void {
        this.setPosition({
            width:
                (this.position.width as number) +
                (this.isEditMode ? EDIT_MENU_WIDTH : -EDIT_MENU_WIDTH),
        });
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        return {
            ...(await super._prepareContext(options)),
            item: this.item,
            isEditMode: this.isEditMode,
            editable: this.isEditable,
            contextActor: this._contextActor,
        };
    }
}
