import { Concrete } from '@system/types/utils';

export type ConcreteApplicationV2Constructor<
    TClass extends foundry.applications.api.ApplicationV2.AnyConstructor,
    TInstance extends foundry.applications.api.ApplicationV2.Any,
> = Omit<TClass, 'new'> & (new(...args: any[]) => TInstance);
export type AnyConcreteApplicationV2Constructor = 
    ConcreteApplicationV2Constructor<
        foundry.applications.api.ApplicationV2.AnyConstructor,
        foundry.applications.api.ApplicationV2.Any
    >;