import {
    Event,
    HandlerType,
    HandlerExecutor,
    HandlerCls,
} from '@system/types/item/event-system';
import { AnyObject } from '@system/types/utils';

export function constructHandlerClass(
    type: string,
    executor: HandlerExecutor,
    config: {
        schema: foundry.data.fields.DataSchema;
    } & (
        | {
              template?: string;
          }
        | {
              render?: (data: AnyObject) => Promise<string>;
          }
    ),
) {
    return class Handler extends foundry.abstract.DataModel {
        public declare type: HandlerType | 'none';

        public static get TYPE() {
            return type;
        }

        public get typeLabel() {
            return this.type !== 'none'
                ? CONFIG.COSMERE.items.events.handlers[this.type].label
                : 'GENERIC.None';
        }

        public get typeDescription() {
            if (this.type === 'none') return null;

            const descriptor =
                CONFIG.COSMERE.items.events.handlers[this.type].description;

            if (typeof descriptor === 'function') {
                return descriptor.call(this);
            } else {
                return descriptor ?? null;
            }
        }

        public get configSchema() {
            return {
                fields: config.schema,
            };
        }

        public get configRenderer() {
            return 'render' in config && config.render
                ? config.render
                : 'template' in config && config.template
                  ? (data: AnyObject) => renderTemplate(config.template!, data)
                  : null;
        }

        static defineSchema() {
            return foundry.utils.mergeObject(
                foundry.utils.deepClone(config.schema),
                {
                    type: new foundry.data.fields.StringField({
                        required: true,
                        initial: type,
                        blank: false,
                        choices: () => ({
                            none: 'None',
                            ...Object.entries(
                                CONFIG.COSMERE.items.events.handlers,
                            ).reduce(
                                (choices, [id, config]) => ({
                                    ...choices,
                                    [id]: config.label,
                                }),
                                {},
                            ),
                        }),
                        label: 'Type',
                    }),
                },
            );
        }

        public execute(event: Event) {
            // Execute the handler
            return executor.call(this, event);
        }
    } as HandlerCls;
}
