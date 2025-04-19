import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

type DocumentType = (typeof CONST.ALL_DOCUMENT_TYPES)[number];

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;

    /**
     * An array of document UUID values
     */
    value?: string[];

    /**
     * The specific type of document that this component should accept (i.e. 'Item')
     */
    type?: DocumentType;

    /**
     * The specific subtype of document that this component should accept (i.e. 'Weapon')
     */
    subtype?: string;

    /**
     * Whether the field is read-only
     */
    readonly?: boolean;

    /**
     * Placeholder text for the input
     */
    placeholder?: string;
};

export class DocumentDropListComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        ConstructorOf<foundry.applications.api.ApplicationV2>,
        Params
    >,
) {
    static FORM_ASSOCIATED = true;

    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_DOCUMENT_DROP_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'remove-document': this.onRemoveDocument,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    static DRAG_DROP = [
        {
            dropSelector: '*',
        },
    ];

    private _value: string[] = [];
    private _name?: string;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: string[] })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { name?: string; value: string[] })
            | undefined;
    }

    public get readonly() {
        return this.params?.readonly === true;
    }

    public get value() {
        return this._value;
    }

    public set value(value: string[]) {
        this._value = value;

        // Set value
        this.element!.value = value;

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change', { bubbles: true }));
    }

    public get name() {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;

        // Set name
        this.element!.name = value;
        $(this.element!).attr('name', value ?? '');
    }

    public get placeholder(): string | undefined {
        return this.params?.placeholder;
    }

    /* --- Actions --- */

    public static onRemoveDocument(
        this: DocumentDropListComponent,
        event: Event,
    ) {
        // Get key
        const key = $(event.target!).closest('[data-id]').data('id') as string;

        // Remove document
        this.value = this.value.filter((v) => v !== key);

        // Rerender
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
        if (this.value.includes(data.uuid)) {
            return ui.notifications.warn(
                game.i18n!.format(
                    'COMPONENT.DocumentDropListComponent.Warning.DocumentAlreadyInList',
                    {
                        type:
                            this.params!.type ??
                            game.i18n!.localize('GENERIC.Document'),
                    },
                ),
            );
        }

        // Validate type
        if (this.params!.type && data.type !== this.params!.type) {
            return ui.notifications.warn(
                game.i18n!.format(
                    'COMPONENT.DocumentDropListComponent.Warning.WrongType',
                    {
                        type: this.params!.type,
                    },
                ),
            );
        }

        // Validate subtype
        if (this.params!.subtype) {
            // Get document
            const doc = (await fromUuid(data.uuid)) as unknown as {
                type: string;
                data: { type: string };
            };

            if (doc.data.type !== this.params!.subtype) {
                return ui.notifications.warn(
                    game.i18n!.format(
                        'COMPONENT.DocumentDropListComponent.Warning.WrongSubtype',
                        {
                            subtype: this.params!.subtype,
                        },
                    ),
                );
            }
        }

        // Add document to the list
        this.value = [...this.value, data.uuid];

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
        // Look up the documents
        const docs = (
            await Promise.all(
                this.value.map(
                    async (uuid) =>
                        (await fromUuid(
                            uuid,
                        )) as unknown as ClientDocument | null,
                ),
            )
        ).filter((v) => !!v);

        return {
            ...params,
            value: this.value,
            documents: docs.map((doc) => ({
                uuid: doc.uuid,
                link: doc.toAnchor().outerHTML,
            })),
        };
    }
}

// Register the component
DocumentDropListComponent.register('app-document-drop-list');
