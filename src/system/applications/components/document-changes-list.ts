import { ConstructorOf, AnyMutableObject } from '@system/types/utils';

import { ChangeData, ChangeDataModel } from '@system/data/item/misc/change';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';
const CHANGE_DATA_SCHEMA = ChangeDataModel.defineSchema();

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;
    value?: ChangeData[];
    readonly?: boolean;
};

export class DocumentChangesListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    Params
> {
    static FORM_ASSOCIATED = true;
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_DOCUMENT_CHANGES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'add-change': this.onAddChange,
        'remove-change': this.onRemoveChange,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private _value: ChangeData[] = [];
    private _name?: string;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: ChangeData[] })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { name?: string; value: ChangeData[] })
            | undefined;
    }

    public get readonly() {
        return this.params?.readonly === true;
    }

    public get value() {
        return this._value;
    }

    public set value(value: ChangeData[]) {
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

    private static onAddChange(this: DocumentChangesListComponent) {
        if (this.readonly) return;
        this.value = [
            ...this.value,
            { key: '', value: '', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
        ];
    }

    private static onRemoveChange(
        this: DocumentChangesListComponent,
        event: Event,
    ) {
        if (this.readonly) return;
        const index = Number(
            $(event.target!).closest('.change[data-index]').data('index'),
        );
        this.value = this.value.filter((_, i) => i !== index);
    }

    /* --- Lifecycle --- */

    protected override _onInitialize() {
        if (this.params!.value) {
            this._value = this.params!.value ?? [];
        }
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

        // Set value
        this.element!.value = this.value ?? '';

        // Set name
        if (this.params!.name) {
            this.name = this.params!.name;
        }

        // Set readonly
        if (this.params!.readonly) {
            $(this.element!).attr('readonly', 'readonly');
        }
    }

    protected override _onAttachListeners(params: Params) {
        super._onAttachListeners(params);

        // Handle changes
        this.element!.querySelectorAll('input, select').forEach((el) =>
            el.addEventListener('change', this.onChange.bind(this)),
        );
    }

    private onChange(event: Event) {
        event.preventDefault();

        // Get input
        const input = event.target as HTMLInputElement | HTMLSelectElement;

        // Get index
        const index = Number(
            $(input).closest('.change[data-index]').data('index'),
        );

        // Get the name
        const name = input.name as keyof ChangeData;

        // Update the value
        (this.value[index] as unknown as AnyMutableObject)[name] = input.value;

        // Set value to trigger change event
        this.value = this._value;
    }

    /* --- Context --- */

    public _prepareContext(params: Params, context: object) {
        return Promise.resolve({
            ...context,
            schema: CHANGE_DATA_SCHEMA,
            readonly: this.readonly,
            changes: this.value,
        });
    }
}

// Register the component
DocumentChangesListComponent.register('app-document-changes-list');
