import {
    Event,
    HandlerType,
    HandlerExecutor,
    HandlerCls,
} from '@system/types/item/events';

export function constructHandlerClass(
    type: string,
    executor: HandlerExecutor,
    configSchema: foundry.data.fields.DataSchema,
) {
    return class Handler extends foundry.abstract.DataModel {
        public declare type: HandlerType;

        public static get TYPE() {
            return type;
        }

        static defineSchema() {
            return foundry.utils.mergeObject(configSchema, {
                type: new foundry.data.fields.StringField({
                    required: true,
                    initial: type,
                    blank: false,
                    choices: [type],
                }),
            });
        }

        public execute(event: Event) {
            // Execute the handler
            return executor.call(this, event);
        }
    } as HandlerCls;
}
