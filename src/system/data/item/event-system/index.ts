import { Events as ItemEvents } from '@system/types/item';

// Fields
import { HandlerField } from './fields/handler-field';

export interface RuleData<C = unknown> {
    /**
     * The id of the Rule
     */
    id: string;

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
    handler: ItemEvents.IHandler & C;
}

export class Rule extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            // TODO: Id disabled because of collection field bug
            // id: new foundry.data.fields.DocumentIdField({ initial: () => foundry.utils.randomID() }),
            order: new foundry.data.fields.NumberField({
                initial: 0,
                integer: true,
                min: 0,
            }),
            event: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: 'none',
                choices: () => [
                    ...Object.keys(CONFIG.COSMERE.items.events.types),
                    'none',
                ],
            }),
            handler: new HandlerField({
                required: true,
            }),
        };
    }
}
