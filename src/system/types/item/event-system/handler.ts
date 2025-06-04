import { Event } from './event';
import { ConstructorOf, AnyObject } from '@system/types/utils';

/**
 * Enum representing the type of handler for an event.
 * Handlers can be anything from adding/removing items to actors, equipping/unequipping items, or using them.
 */
export const enum HandlerType {
    GrantItems = 'grant-items',
    RemoveItems = 'remove-items',

    // Utility handlers (technically covered by UpdateItem & UpdateActor, but provide a nice shorthand)
    ModifyAttribute = 'modify-attribute',
    SetAttribute = 'set-attribute',
    ModifySkillRank = 'modify-skill-rank',
    SetSkillRank = 'set-skill-rank',
    GrantExpertises = 'grant-expertises',
    RemoveExpertises = 'remove-expertises',

    UseItem = 'use-item',

    // General purpose
    UpdateItem = 'update-item',
    UpdateActor = 'update-actor',
    ExecuteMacro = 'execute-macro',
}

export type HandlerConfig<T = unknown> = {
    type: HandlerType;
} & T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandlerExecutor<E extends Event = Event<any, any, any>> = (
    event: E,
) => void | boolean | Promise<void | boolean>;

export interface IHandler {
    type: HandlerType;
    typeLabel: string;
    configSchema: { fields: foundry.data.fields.DataSchema };
    configRenderer: ((data: AnyObject) => Promise<string>) | null;
    execute: HandlerExecutor;
}

export type HandlerCls = ConstructorOf<IHandler> &
    typeof foundry.abstract.DataModel;
