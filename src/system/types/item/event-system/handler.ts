import { Event } from './event';
import { ConstructorOf, AnyObject, Concrete } from '@system/types/utils';

import { HandlerBaseSchema } from '@system/data/item/event-system/handler';

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

export interface IHandler<
    TSchema extends
        foundry.data.fields.DataSchema = foundry.data.fields.DataSchema,
> {
    type: string;
    typeLabel: string;
    configSchema: { fields: TSchema };
    configRenderer: ((data: AnyObject) => Promise<string>) | null;
    execute: HandlerExecutor;
}

export type HandlerCls<
    TSchema extends
        foundry.data.fields.DataSchema = foundry.data.fields.DataSchema,
> = ConstructorOf<IHandler<TSchema>> &
    Concrete<typeof foundry.abstract.DataModel<HandlerBaseSchema & TSchema>>;
