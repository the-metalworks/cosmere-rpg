// Types
import { ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';

// Documents
import { CosmereItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

//Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

interface ItemDropRef {
    uuid: string;
    quantity?: string;
}

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;

    /**
     * An array of document UUID values
     */
    value?: ItemDropRef[];

    /**
     * The specific type of item that this component should accept (i.e. 'Weapon')
     */
    type?: ItemType;

    /**
     * Whether the field is read-only
     */
    readonly?: boolean;

    /**
     * Placeholder text for the input
     */
    placeholder?: string;
};

export class ItemDropListComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        ConstructorOf<foundry.applications.api.ApplicationV2>,
        Params
    >,
) {
    static FORM_ASSOCIATED = true;

    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_ITEM_DROP_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'remove-item': this.onRemoveItem,
    };

    static DRAG_DROP = [
        {
            dropSelector: '*',
        },
    ];

    private _value: ItemDropRef[] = [];
    private _name?: string;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: ItemDropRef[] })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { name?: string; value: ItemDropRef[] })
            | undefined;
    }

    public get readonly(): boolean {
        return this.params?.readonly === true;
    }

    public get value(): ItemDropRef[] {
        return this._value;
    }

    public set value(value: ItemDropRef[]) {
        this._value = value;

        // Set value
        this.element!.value = value;

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change', { bubbles: true }));
    }

    public get name() {
        return this._name;
    }

    public set name(name: string | undefined) {
        this._name = name;

        // Set name
        this.element!.name = name;
        $(this.element!).attr('name', name ?? '');
    }

    public get placeholder() {
        return this.params?.placeholder;
    }

    /* --- Actions --- */

    private static onRemoveItem(
        this: ItemDropListComponent,
        event: Event,
    ): void {
        // Get key
        const key = $(event.target!).closest('[data-id]').data('id') as string;

        // Remove document
        this.value = this.value.filter((v) => v.uuid !== key);

        // Re-render
        void this.render();
    }

    /* --- Drag drop --- */

    protected override _canDragDrop() {
        return !this.readonly;
    }

    protected override _onDragOver(event: DragEvent) {
        if (this.readonly) return;

        $(this.element!).find('.drop-area').addClass('dropping');
    }

    protected override async _onDrop(event: DragEvent) {
        if (this.readonly) return;

        // Remove dragover class
        $(this.element!).find('.drop-area').removeClass('dropping');

        // Get data
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };

        // Ensure the document is not already in the list
        if (this.value.some((v) => v.uuid === data.uuid)) {
            return ui.notifications.warn(
                game.i18n!.format(
                    'COMPONENT.DocumentDropListComponent.Warning.DocumentAlreadyInList',
                    {
                        type: 'Item',
                    },
                ),
            );
        }

        // Validate document type
        if (data.type !== 'Item') {
            return ui.notifications.warn(
                game.i18n!.format(
                    'COMPONENT.DocumentDropListComponent.Warning.WrongType',
                    {
                        type: 'Item',
                    },
                ),
            );
        }

        // Get the item
        const item = (await fromUuid(data.uuid)) as unknown as CosmereItem;

        // Validate item type
        if (this.params!.type) {
            if (item.type !== this.params!.type) {
                return ui.notifications.warn(
                    game.i18n!.format(
                        'COMPONENT.DocumentDropListComponent.Warning.WrongSubtype',
                        {
                            subtype: this.params!.type,
                        },
                    ),
                );
            }
        }

        // Add document to the list
        this.value = [
            ...this.value,
            {
                uuid: data.uuid,
                ...(item.isPhysical()
                    ? { quantity: item.system.quantity?.toFixed() }
                    : {}),
            },
        ];

        // Render
        void this.render();
    }

    /* --- Lifecycle --- */

    protected override _onInitialize(params: Params) {
        super._onInitialize(params);

        if (this.params!.value) {
            this._value = this.params!.value;
        }
    }

    public override _onAttachListeners(params: Params) {
        super._onAttachListeners(params);

        $(this.element!).on('dragleave', () => {
            $(this.element!).find('.drop-area').removeClass('dropping');
        });

        $(this.element!)
            .find('.document input[name="quantity"]')
            .on('change', (event) => {
                const target = event.target as HTMLInputElement;
                const uuid = $(target)
                    .closest('.document')
                    .data('id') as string;

                // Update the quantity for the item
                const ref = this.value.find((v) => v.uuid === uuid);

                if (ref) {
                    ref.quantity = target.value;
                }

                // Update the value
                this.value = [...this.value];

                // Re-render
                void this.render();
            });
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

        // Set value
        this.element!.value = this.value ?? [];

        // Set name
        if (this.params!.name) {
            this.name = this.params!.name;
        }

        // Set readonly
        if (this.params!.readonly) {
            $(this.element!).attr('readonly', 'readonly');
        }
    }

    /* --- Context --- */

    public async _prepareContext(params: Params) {
        // Look up the items
        const items = await Promise.all(
            this.value.map(
                async ({ uuid }) =>
                    (await fromUuid(uuid)) as unknown as CosmereItem | null,
            ),
        );

        return {
            ...params,
            value: this.value,
            items: this.value.map((ref, i) => ({
                ...ref,
                isPhysical: items[i]?.isPhysical() ?? false,
                link: items[i]?.toAnchor().outerHTML ?? '',
            })),
        };
    }
}

// Register the component
ItemDropListComponent.register('app-item-drop-list');
