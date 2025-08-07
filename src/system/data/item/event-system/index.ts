// Fields
import { HandlerField } from './fields/handler-field';

const SCHEMA = {
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

export type RuleDataSchema = typeof SCHEMA;
export type RuleData = foundry.data.fields.SchemaField.InitializedData<RuleDataSchema>;

export class Rule extends foundry.abstract.DataModel<RuleDataSchema, foundry.abstract.DataModel.Any> {
    static defineSchema() {
        return SCHEMA;
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
