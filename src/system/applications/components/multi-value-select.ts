import {
    ConstructorOf,
    AnyObject,
    DeepPartial,
    EmptyObject,
} from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import {
    ComponentHandlebarsRenderOptions,
    HandlebarsApplicationComponent,
} from '@system/applications/component-system';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;

    /**
     * The selected values
     */
    value?: string[];

    /**
     * The available options
     */
    options?:
        | string[]
        | Record<string, string>
        | (() => string[] | Record<string, string>);

    /**
     * Placeholder text for the input
     */
    placeholder?: string;

    /**
     * Whether the field is read-only
     */
    readonly?: boolean;
};

export class MultiValueSelectComponent extends HandlebarsApplicationComponent<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    Params
> {
    static FORM_ASSOCIATED = true;

    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MULTI_VALUE_SELECT}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        remove: this.onRemove,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

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

    public static onRemove(this: MultiValueSelectComponent, event: Event) {
        // Get key
        const key = $(event.target!).closest('[data-id]').data('id') as string;

        // Remove value
        this.value = this.value.filter((value) => value !== key);

        // Rerender
        void this.render();
    }

    /* --- Lifecycle --- */

    protected override _onInitialize() {
        if (this.params!.value) {
            this._value = this.params!.value ?? [];
        }
    }

    protected override _onAttachListeners(params: Params) {
        super._onAttachListeners(params);

        // Handle select change
        $(this.element!)
            .find('select')
            .on('change', (event) => {
                const value = $(event.currentTarget).val() as string;

                // Add value
                this.value = [...this.value, value];

                // Rerender
                void this.render();
            });
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

    /* --- Context --- */

    public _prepareContext(params: Params) {
        // Default options
        params.options ??= [];

        // Prepare options
        let options =
            foundry.utils.getType(params.options) === 'function'
                ? (params.options as () => string[] | Record<string, string>)()
                : params.options;

        options =
            foundry.utils.getType(options) === 'Object'
                ? (foundry.utils.deepClone(options) as Record<string, string>)
                : (options as string[]).reduce(
                      (acc, key) => ({ ...acc, [key]: key }),
                      {} as Record<string, string>,
                  );

        // Prepare selected
        const selected = this._value.map((key) => ({
            key,
            label: options[key],
        }));

        // Remove selected from options
        this._value.forEach((key) => delete options[key]);

        return Promise.resolve({
            selected,
            options,
            readonly: this.readonly,
            placeholder: this.placeholder,
        });
    }
}

// Register the component
MultiValueSelectComponent.register('app-multi-value-select');
