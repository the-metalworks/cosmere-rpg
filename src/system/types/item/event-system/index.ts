import { Event } from './event';
import type { HandlerConfig } from './handler';

export { Event } from './event';
export { HandlerType } from './handler';
export type { HandlerExecutor, IHandler, HandlerCls } from './handler';

export interface Rule {
    id: string;
    description: string;
    event: string;
    handler: HandlerConfig;
}
