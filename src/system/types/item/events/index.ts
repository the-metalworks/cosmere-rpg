import { Event } from './event';
import { HandlerConfig } from './handler';

export { Event } from './event';
export { HandlerType, HandlerExecutor, IHandler, HandlerCls } from './handler';

export interface Rule {
    id: string;
    description: string;
    event: string;
    handler: HandlerConfig;
}
