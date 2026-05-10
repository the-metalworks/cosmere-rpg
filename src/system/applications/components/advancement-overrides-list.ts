import { Advancement } from '@system/types/advancement';

import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';
import { AdvancementOverrideData } from '@src/system/data/item/misc/advancement-override';
import { OverrideSelectOption } from '@src/system/utils/handlebars/types';
import { AttributeConfig, SkillConfig } from '@src/system/types/config';
import AdvancementManager from '@src/system/utils/advancement';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    name?: string;
    value?: AdvancementOverrideData[];
};

export class AdvancementOverridesListComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    Params
> {
    static FORM_ASSOCIATED = true;

    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_ADVANCEMENT_OVERRIDES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'create-override': this.onCreateOverride,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private _value: AdvancementOverrideData[] = [];
    private _name?: string;

    /* --- Accessors --- */

    public get element():
        | (HTMLElement & { name?: string; value: AdvancementOverrideData[] })
        | undefined {
        return super.element as unknown as
            | (HTMLElement & {
                  name?: string;
                  value: AdvancementOverrideData[];
              })
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

    public get name() {
        return this._name;
    }

    public set name(name: string | undefined) {
        this._name = name;

        // Set name
        this.element!.name = name;
        $(this.element!).attr('name', name ?? '');
    }

    /* --- Actions --- */

    private static onCreateOverride(
        this: AdvancementOverridesListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();

        const id = foundry.utils.randomID();

        this.value = [
            ...this.value,
            {
                id,
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

    private static getOptionsContext(
        override: AdvancementOverrideData,
    ): Record<string, OverrideSelectOption[]> {
        return {
            type: Object.values(Advancement.OverrideType).map((v) => ({
                value: v,
                label: `COSMERE.Advancement.Override.Type.${v}`,
            })),
            mode: Object.values(Advancement.OverrideMode).map((v) => ({
                value: v,
                label: `COSMERE.Advancement.Override.Mode.${v}`,
            })),
            key:
                override.type === Advancement.OverrideType.Grants
                    ? Object.values(Advancement.GrantsFieldKey).map((v) => ({
                          value: v,
                          label: `COSMERE.Advancement.Override.Field.grants.${v}.Label`,
                          tooltip: `COSMERE.Advancement.Override.Field.grants.${v}.Description`,
                      }))
                    : Object.values(Advancement.MaxStatFieldKey).map((v) => ({
                          value: v,
                          label: `COSMERE.Advancement.Override.Field.max-stat.${v}.Label`,
                          tooltip: `COSMERE.Advancement.Override.Field.grants.${v}.Description`,
                      })),
            stat: CONFIG.COSMERE[override.key as Advancement.MaxStatFieldKey]
                ? Object.entries(
                      CONFIG.COSMERE[
                          override.key as Advancement.MaxStatFieldKey
                      ],
                  ).map(([k, v]) => ({
                      value: k,
                      label: (v as AttributeConfig | SkillConfig).label,
                  }))
                : [],
        };
    }

    /* --- Lifecycle --- */

    protected override _onInitialize(params: Params) {
        super._onInitialize(params);

        if (this.params!.value) {
            this._value = this.params!.value;
        }
    }

    protected override _onAttachListeners(params: Params) {
        super._onAttachListeners(params);

        this.attachChangeListener('levels.min');
        this.attachChangeListener('levels.max');
        this.attachChangeListener('type');
        this.attachChangeListener('mode');
        this.attachChangeListener('key');
        this.attachChangeListener('stat');
        this.attachChangeListener('value');
        this.attachChangeListener('priority');
    }

    protected override _onRender(params: Params) {
        super._onRender(params);

        // Set value
        this.element!.value = this.value ?? '';

        // Set name
        if (this.params!.name) {
            this.name = this.params!.name;
        }
    }

    public _prepareContext(params: Params, context: object) {
        return Promise.resolve({
            ...context,

            overrides: AdvancementManager.sortOverrideList(
                this.value.map((override) => ({
                    ...override,
                    options:
                        AdvancementOverridesListComponent.getOptionsContext(
                            override,
                        ),
                })),
            ),
        });
    }

    /* --- Helpers --- */

    /**
     * Constructs and attaches an event listener to update data for a particular field
     */
    protected attachChangeListener(
        field: keyof AdvancementOverrideData | 'levels.min' | 'levels.max',
    ) {
        $(this.element!)
            .find(`.override .detail > [name="${field}"]`)
            .on('change', (event: JQuery.ChangeEvent) => {
                const target = event.target as
                    | HTMLInputElement
                    | HTMLSelectElement;
                const overrideId = $(target)
                    .closest('.override')
                    .data('id') as string;

                const ref = this.value.find((v) => v.id === overrideId);

                if (ref) {
                    // Update value for the override based on the relevant field
                    switch (field) {
                        case 'levels.min':
                            ref.levels.min = parseInt(target.value);
                            break;
                        case 'levels.max':
                            ref.levels.max = parseInt(target.value);
                            break;
                        case 'type':
                            ref.type = target.value as Advancement.OverrideType;
                            // Set the key to a reasonable default when the type changes
                            ref.key = Object.values(
                                ref.type === Advancement.OverrideType.Grants
                                    ? Advancement.GrantsFieldKey
                                    : Advancement.MaxStatFieldKey,
                            )[0] as string;
                            break;
                        case 'mode':
                            ref.mode = target.value as Advancement.OverrideMode;
                            break;
                        case 'key':
                            ref.key = target.value;
                            break;
                        case 'stat':
                            ref.stat = target.value || undefined;
                            break;
                        case 'value':
                            ref.value = target.value;
                            break;
                        case 'priority':
                            ref.priority = parseInt(target.value);
                            break;
                    }

                    // Update the value
                    this.value = [...this.value];

                    // Re-render
                    void this.render();
                }
            });
    }
}

// Register
AdvancementOverridesListComponent.register('app-advancement-overrides-list');
