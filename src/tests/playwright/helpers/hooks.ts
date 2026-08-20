import { Page } from '@playwright/test';

export async function paramsFromHook<K extends Hooks.HookName>(
    page: Page,
    hookName: K,
    timeout = 10000,
) {
    // Create a promise which will resolve to the args of whatever hook we're waiting on
    return await page.evaluate(
        ({ hookName, timeout }) => {
            let done = false;
            return new Promise<Hooks.HookParameters<K>>((resolve, reject) => {
                // Create a handler which will be called by the hook so we can type it as a hook function
                const handler = ((...hookArgs: Hooks.HookParameters<K>) => {
                    done = true;

                    // Ensure that any id/uuid getters are serialized before returning to the playwright context.
                    const findGetter = (obj: object, prop: string) => {
                        let current: object | null = obj;
                        while (current) {
                            const descriptor = Object.getOwnPropertyDescriptor(
                                current,
                                prop,
                            );
                            if (descriptor)
                                return typeof descriptor.get === 'function'
                                    ? descriptor
                                    : undefined;
                            current = Object.getPrototypeOf(current) as
                                | object
                                | null;
                        }
                        return undefined;
                    };

                    for (const hookArg of hookArgs) {
                        if (typeof hookArg !== 'object' || hookArg === null)
                            continue;

                        for (const prop of ['id', 'uuid'] as const) {
                            if (!findGetter(hookArg, prop)) continue;

                            const value = (hookArg as Record<string, unknown>)[
                                prop
                            ];
                            Object.defineProperty(hookArg, prop, {
                                value,
                                writable: true,
                                enumerable: true,
                                configurable: true,
                            });
                        }
                    }
                    resolve(hookArgs);
                    console.log('Parameters in Foundry context:');
                    console.log(hookArgs);
                    Hooks.off(hookName, hookId);
                    return true;
                }) as Hooks.Function<K>;

                const hookId = Hooks.on(hookName as K, handler);

                setTimeout(function () {
                    if (done) return;
                    Hooks.off(hookName as K, hookId);
                    reject(Error(`await ${hookName} timed out`));
                }, timeout);
            });
        },
        { hookName, timeout },
    );
}

export async function getLocatorForNextWindowToOpen(
    page: Page,
    timeout = 3000,
) {
    const [application] = await paramsFromHook(
        page,
        'renderApplicationV2',
        timeout,
    );

    return page.locator(`#${application.id}`);
}
