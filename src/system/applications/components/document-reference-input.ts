import { ConstructorOf, AnyObject } from '@system/types/utils';

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
     * The document UUID value
     */
    value?: string;

    /**
     * The specific type of document this field can reference (i.e. 'Item')
     */
    type?: DocumentType;

    /**
     * The specific subtype of document this field can reference (i.e. 'Weapon')
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

export class DocumentReferenceInputComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        ConstructorOf<foundry.applications.api.ApplicationV2>,
        Params
    >,
) {
    static FORM_ASSOCIATED = true;

    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/general/components/document-reference-input.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        clear: this.onClear,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    static DRAG_DROP = [
        {
            dropSelector: '*',
        },
    ];

    private _value = '';
    private _name?: string;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: string })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { name?: string; value: string })
            | undefined;
    }

    public get readonly() {
        return this.params?.readonly !== false;
    }

    public get value() {
        return this._value;
    }

    public set value(value: string) {
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

    /* --- Actions --- */

    public static async onClear(this: DocumentReferenceInputComponent) {
        this._value = '';
        await this.render();
    }

    /* --- Drag drop --- */

    protected override _canDragDrop() {
        return !this.readonly;
    }

    protected override _onDragOver(event: DragEvent) {
        if (this.readonly) return;

        $(this.element!).addClass('dragover');
    }

    protected override async _onDrop(event: DragEvent) {
        if (this.readonly) return;

        // Remove dragover class
        $(this.element!).removeClass('dragover');

        // Get data
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };

        // Validate type
        if (this.params!.type && data.type !== this.params!.type) {
            return ui.notifications.warn(
                game.i18n!.format(
                    'COMPONENT.DocumentReferenceInput.Warning.WrongType',
                    {
                        type: this.params!.type,
                    },
                ),
            );
        }

        if (this.params?.type && this.params?.subtype) {
            // Get document
            const doc = (await fromUuid(data.uuid)) as unknown as {
                type: string;
            };

            // Validate subtype
            if (doc.type !== this.params.subtype) {
                const subtypeLabel = (
                    CONFIG as unknown as Record<
                        DocumentType,
                        { typeLabels: Record<string, string> }
                    >
                )[this.params.type].typeLabels[this.params.subtype];

                return ui.notifications.warn(
                    game.i18n!.format(
                        'COMPONENT.DocumentReferenceInput.Warning.WrongSubtype',
                        {
                            type: this.params.type,
                            subtype: game.i18n!.localize(subtypeLabel),
                        },
                    ),
                );
            }
        }

        // Set value
        this.value = data.uuid;

        // Render
        void this.render();
    }

    /* --- Lifecycle --- */

    protected override _onInitialize() {
        if (this.params!.value) {
            this._value = this.params!.value ?? '';
        }
    }

    public override _onAttachListeners(params: Params) {
        super._onAttachListeners(params);

        $(this.element!).on('dragleave', () => {
            $(this.element!).removeClass('dragover');
        });
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

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
        // Look up the document
        const doc = this.value
            ? ((await fromUuid(this.value)) as ClientDocument | null)
            : undefined;

        // Generate content link
        const contentLink = doc
            ? new Handlebars.SafeString(doc.toAnchor().outerHTML)
            : undefined;

        const subtypeLabel =
            params.type && params.subtype
                ? (
                      CONFIG as unknown as Record<
                          DocumentType,
                          { typeLabels: Record<string, string> }
                      >
                  )[params.type].typeLabels[params.subtype]
                : undefined;

        // Format default placeholder
        const defaultPlaceholder = game.i18n!.format(
            'COMPONENT.DocumentReferenceInput.Placeholder',
            {
                type: game.i18n!.localize(
                    subtypeLabel ?? params.type ?? 'GENERIC.Document',
                ),
            },
        );

        return {
            value: this.value,
            placeholder: params.placeholder,
            readonly: params.readonly,
            contentLink,
            defaultPlaceholder,
        };
    }
}

// Register the component
DocumentReferenceInputComponent.register('app-document-reference-input');
