import { ConstructorOf, AnyObject } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

interface StateConfig {
    label: string;
    color?: string;
}

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;
    selected?: string;
    states: string[] | Record<string, string> | Record<string, StateConfig>;
    localize?: boolean;
};

export class MultiStateToggleComponent extends HandlebarsApplicationComponent<
    ConstructorOf<foundry.applications.api.ApplicationV2>,
    Params
> {
    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/general/components/multi-state-toggle.hbs';

    protected get states(): Record<string, StateConfig> {
        if (Array.isArray(this.params!.states)) {
            return this.params!.states.reduce(
                (acc, state) => ({
                    ...acc,
                    [state]: {
                        label: state,
                    },
                }),
                {} as Record<string, StateConfig>,
            );
        } else {
            return (
                Object.entries(this.params!.states) as [
                    string,
                    string | StateConfig,
                ][]
            ).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: typeof value === 'string' ? { label: value } : value,
                }),
                {} as Record<string, StateConfig>,
            );
        }
    }

    protected get selected(): string {
        return this.params!.selected ?? Object.keys(this.states)[0];
    }

    protected get numStates(): number {
        return Object.keys(this.states).length;
    }

    protected get selectedIndex(): number {
        return Object.keys(this.states).indexOf(this.selected);
    }

    /* --- Lifecyle --- */

    protected _onRender(params: Params): void {
        if (params.name) $(this.element!).attr('name', params.name);
    }

    protected _onAttachListeners() {
        // Get input elements
        const input = $(this.element!).find('input');

        // Add event listeners
        input.on('change', this.onChange.bind(this));
    }

    private onChange(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        // Get input
        const input = event.target as HTMLInputElement;

        // Get the state
        const state = input.dataset.id!;

        // Set value
        $(this.element!).attr('value', state);

        // Trigger change event
        $(this.element!).trigger('change', new InputEvent('change'));

        // Update params
        this.params!.selected = state;

        // Update offset
        const stateWidth = 100 / this.numStates;
        const selectedOffset = stateWidth * this.selectedIndex;
        $(this.element!)
            .find('.selected')
            .css('background-color', this.states[state].color ?? '')
            .css('left', `${selectedOffset.toFixed(3)}%`);
    }

    /* --- Context --- */

    public _prepareContext(params: Params, context: AnyObject) {
        const stateWidth = 100 / this.numStates;
        const selectedOffset = stateWidth * this.selectedIndex;

        return Promise.resolve({
            ...context,
            ...params,
            id: this.id,
            value: this.selected,
            states: Object.entries(this.states).map(([key, config]) => ({
                key,
                label:
                    params.localize !== false
                        ? game.i18n!.localize(config.label)
                        : config.label,
                color: config.color,
                selected: key === this.selected,
            })),
            stateWidth: `${stateWidth.toFixed(3)}%`,
            selectedOffset: `${selectedOffset.toFixed(3)}%`,
            selectedColor: this.states[this.selected].color,
        });
    }
}

// Register the component
MultiStateToggleComponent.register('app-multi-state-toggle');
