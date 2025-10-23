import {
    Event,
    HandlerType,
    HandlerExecutor,
    HandlerCls,
} from '@system/types/item/event-system';
import { AnyObject } from '@system/types/utils';

import { BASE_SCHEMA, HandlerBaseSchema } from '@system/data/item/event-system/handler';

export function constructHandlerClass<
    TSchema extends foundry.data.fields.DataSchema
>(
    type: string,
    executor: HandlerExecutor,
    config: {
        schema: TSchema;
    } & (
            | {
                template?: string;
            }
            | {
                render?: (data: AnyObject) => Promise<string>;
            }
        ),
) {
    return class Handler extends foundry.abstract.DataModel<HandlerBaseSchema & TSchema> {
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
                BASE_SCHEMA(type as HandlerType | 'none'),
            );
        }

        public execute(event: Event) {
            // Execute the handler
            return executor.call(this, event);
        }
    } as HandlerCls<TSchema>;
}
