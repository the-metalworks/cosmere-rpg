import { ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';
import { ConnectionItemDataModel } from '@system/data/item';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../../base';

interface ConnectionItemState {
    expanded?: boolean;
}

export class CharacterConnectionsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_CONNECTIONS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-connection-controls': this.onToggleConnectionControls,
        'add-connection': this.onAddConnection,
        'remove-connection': this.onRemoveConnection,
        'edit-connection': this.onEditConnection,
        'toggle-expand-connection': this.onToggleExpandConnection,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private connectionItemStates: Record<string, ConnectionItemState> = {};

    private contextConnectionId: string | null = null;
    private controlsDropdownExpanded = false;
    private controlsDropdownPosition?: { top: number; right: number };

    /* --- Connections --- */

    public static onToggleConnectionControls(
        this: CharacterConnectionsListComponent,
        event: PointerEvent,
    ) {
        this.controlsDropdownExpanded = !this.controlsDropdownExpanded;

        if (this.controlsDropdownExpanded) {
            // Get connection id
            const connectionId = $(event.currentTarget!)
                .closest('[data-id]')
                .data('id') as string;

            this.contextConnectionId = connectionId;

            const target = (event.currentTarget as HTMLElement).closest(
                '.item',
            )!;
            const targetRect = target.getBoundingClientRect();
            const rootRect = this.element!.getBoundingClientRect();

            this.controlsDropdownPosition = {
                top: targetRect.bottom - rootRect.top,
                right: rootRect.right - targetRect.right,
            };
        } else {
            this.contextConnectionId = null;
        }

        void this.render();
    }

    public static async onAddConnection(
        this: CharacterConnectionsListComponent,
    ) {
        // Create connection
        const [{ id }] = await this.application.actor.createEmbeddedDocuments(
            'Item',
            [
                {
                    type: ItemType.Connection,
                    name: game.i18n!.localize(
                        'COSMERE.Actor.Sheet.Details.Connections.NewText',
                    ),
                },
            ],
            {
                render: false,
            },
        );

        // Render
        await this.render();

        // Edit the connection
        this.editConnection(id);
    }

    public static async onRemoveConnection(
        this: CharacterConnectionsListComponent,
    ) {
        this.controlsDropdownExpanded = false;

        // Ensure context goal id is set
        if (this.contextConnectionId !== null) {
            // Remove the connection
            await this.application.actor.deleteEmbeddedDocuments(
                'Item',
                [this.contextConnectionId],
                { render: false },
            );
        }

        // Render
        await this.render();
    }

    public static onEditConnection(this: CharacterConnectionsListComponent) {
        this.controlsDropdownExpanded = false;

        // Ensure context goal id is set
        if (this.contextConnectionId !== null) {
            // Get the connection
            const connection = this.application.actor.items.find(
                (i) => i.id === this.contextConnectionId,
            ) as CosmereItem<ConnectionItemDataModel>;

            // Show connection sheet
            void connection.sheet?.render(true);
        }

        // Render
        void this.render();
    }

    public static onToggleExpandConnection(
        this: CharacterConnectionsListComponent,
        event: Event,
    ) {
        // Get connection id
        const connectionId = $(event.currentTarget!)
            .closest('[data-id]')
            .data('id') as string;

        // Toggle expanded state
        this.connectionItemStates[connectionId].expanded =
            !this.connectionItemStates[connectionId].expanded;

        // Render
        void this.render();
    }

    /* --- Context --- */

    public async _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        // Get connections
        const connections = this.application.actor.items.filter((item) =>
            item.isConnection(),
        );

        // Ensure item state exists for each connection
        connections.forEach((item) => {
            if (!(item.id in this.connectionItemStates)) {
                this.connectionItemStates[item.id] = {};
            }
        });

        return {
            ...context,

            connections: await Promise.all(
                connections.map(async (item) => ({
                    ...item,
                    ...this.connectionItemStates[item.id],
                    id: item.id,
                    descriptionHTML: await TextEditor.enrichHTML(
                        // NOTE: We use a logical OR here to catch both nullish values and empty string
                        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                        item.system.description?.value || '<p>—</p>',
                        {
                            relativeTo: (item.parent ?? undefined) as
                                | foundry.abstract.Document.Any
                                | undefined,
                        },
                    ),
                })),
            ),

            controlsDropdown: {
                expanded: this.controlsDropdownExpanded,
                position: this.controlsDropdownPosition,
            },
        };
    }

    /* --- Helpers --- */

    private editConnection(id: string) {
        // Get goal element
        const element = $(this.element!).find(
            `.connection:not(.details)[data-id="${id}"]`,
        );

        // Get span element
        const span = element.find('span.title');

        // Hide span title
        span.addClass('inactive');

        // Get input element
        const input = element.find('input.title');

        // Show
        input.removeClass('inactive');

        setTimeout(() => {
            // Focus input
            input.trigger('select');

            // Add event handler
            input.on('focusout', async () => {
                // Remove handler
                input.off('focusout');

                // Get the connection
                const connection = this.application.actor.items.find(
                    (i) => i.id === id,
                ) as CosmereItem<ConnectionItemDataModel>;

                // Update the connection
                await connection.update({
                    name: input.val(),
                });

                // Render
                void this.render();
            });

            input.on('keypress', (event) => {
                if (event.which !== 13) return; // Enter key

                event.preventDefault();
                event.stopPropagation();

                input.trigger('focusout');
            });
        });
    }
}

// Register
CharacterConnectionsListComponent.register('app-character-connections-list');
