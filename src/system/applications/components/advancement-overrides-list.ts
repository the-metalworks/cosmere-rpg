import { Advancement } from '@system/types/advancement';

import {
    ComponentHandlebarsRenderOptions,
    HandlebarsApplicationComponent,
} from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';
import { AdvancementOverrideData } from '@src/system/data/item/misc/advancement-override';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    value?: AdvancementOverrideData[];
};

export class AdvancementOverridesListComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    Params
> {
    static FORM_ASSOCIATED = true;

    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_ADVANCEMENT_OVERRIDES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'add-override': this.onAddOverride,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private _value: AdvancementOverrideData[] = [];

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { value: AdvancementOverrideData[] })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & { value: AdvancementOverrideData[] })
            | undefined;
    }

    public get value() {
        return this._value;
    }

    public set value(value: AdvancementOverrideData[]) {
        this._value = value;

        // Set value
        this.element!.value = value;

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* --- Actions --- */

    private static onAddOverride(
        this: AdvancementOverridesListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        this.value = [
            ...this.value,
            {
                levels: {
                    min: 1,
                    max: 1,
                },
                type: Advancement.OverrideType.Grants,
                mode: Advancement.OverrideMode.Relative,
                key: Advancement.GrantsFieldKey.Health,
                stat: undefined,
                value: 0,
                priority: 0,
                source: undefined,
            },
        ];
    }

    /* --- Lifecycle --- */

    protected override _onInitialize() {
        if (this.params!.value) {
            this._value = this.params!.value;
        }
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

        // Set value
        this.element!.value = this.value ?? '';
    }

    public _prepareContext(params: Params, context: object) {
        return Promise.resolve({
            ...context,

            overrides: this.value.sort((a, b) => {
                if (
                    a.levels.min === b.levels.min &&
                    a.levels.max === b.levels.max
                ) {
                    // Both apply to identical level ranges
                    return 0;
                }

                const aMin = a.levels.min ?? -Infinity;
                const bMin = b.levels.min ?? -Infinity;
                if (aMin !== bMin) {
                    // A and B start at different levels.
                    // Sort accordingly.
                    return aMin - bMin;
                }

                // A and B start at the same level.
                // Sort based on end level.
                const aMax = a.levels.max ?? Infinity;
                const bMax = b.levels.max ?? Infinity;
                return aMax - bMax;
            }),
        });
    }
}

// Register
AdvancementOverridesListComponent.register('app-advancement-overrides-list');
