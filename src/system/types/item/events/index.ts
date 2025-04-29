import { EventType, Event } from './event';
import { HandlerConfig } from './handler';

export { EventType, Event } from './event';
export { HandlerType, HandlerExecutor, IHandler, HandlerCls } from './handler';

export interface Rule {
    event: EventType;
    handler: HandlerConfig;
}
