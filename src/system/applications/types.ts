// NOTE: Have to explicitly use any here to allow proper constructor typing
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ConcreteApplicationV2Constructor<
    TClass extends foundry.applications.api.ApplicationV2.AnyConstructor,
    TInstance extends foundry.applications.api.ApplicationV2.Any,
> = Omit<TClass, 'new'> & (new (...args: any[]) => TInstance);
export type AnyConcreteApplicationV2Constructor =
    ConcreteApplicationV2Constructor<
        foundry.applications.api.ApplicationV2.AnyConstructor,
        foundry.applications.api.ApplicationV2.Any
    >;
/* eslint-enable @typescript-eslint/no-explicit-any */
