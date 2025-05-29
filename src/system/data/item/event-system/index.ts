import { EventSystem as ItemEventSystem } from '@system/types/item';

// Fields
import { HandlerField } from './fields/handler-field';

export interface RuleData<C = unknown> {
    /**
     * The id of the Rule
     */
    id: string;

    description: string;

    /**
     * The sort order of the Rule.
     * This is used to determine the order in which the rules are displayed.
     * Also affects the order in which the rules are executed.
     */
    order: number;

    /**
     * The event for which this rule is triggered.
     *
     * @default 'none'
     */
    event: string;

    /**
     * The handler for this rule
     */
    handler: ItemEventSystem.IHandler & C & foundry.abstract.DataModel;
}

export class Rule extends foundry.abstract.DataModel<RuleData> {
    static defineSchema() {
        return {
            id: new foundry.data.fields.DocumentIdField({
                initial: () => foundry.utils.randomID(),
                readonly: false,
            }),
            description: new foundry.data.fields.StringField({
                required: true,
                initial: '',
                label: 'COSMERE.Item.EventSystem.Event.Rule.Description.Label',
            }),
            order: new foundry.data.fields.NumberField({
                initial: 0,
                integer: true,
                min: 0,
            }),
            event: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: 'none',
                choices: () => ({
                    none: 'None',
                    ...Object.entries(CONFIG.COSMERE.items.events.types).reduce(
                        (choices, [id, config]) => ({
                            ...choices,
                            [id]: config.label,
                        }),
                        {},
                    ),
                }),
                label: 'COSMERE.Item.EventSystem.Event.Rule.Event.Label',
            }),
            handler: new HandlerField({
                required: true,
            }),
        };
    }

    /* --- Accessors --- */

    public get eventTypeLabel(): string {
        return this.event !== 'none'
            ? CONFIG.COSMERE.items.events.types[this.event].label
            : 'None';
    }

    public get eventTypeDescription(): string {
        return this.event !== 'none'
            ? (CONFIG.COSMERE.items.events.types[this.event].description ?? '')
            : '';
    }
}
