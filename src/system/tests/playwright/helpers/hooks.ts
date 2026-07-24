import { Page } from '@playwright/test';

export async function paramsFromHook<K extends Hooks.HookName>(
    page: Page,
    hookName: K,
    timeout = 3000,
) {
    // Create a promise which will resolve to the args of whatever hook we're waiting on
    return await page.evaluate(
        ({ hookName, timeout }) => {
            let done = false;
            return new Promise<Hooks.HookParameters<K>>((resolve, reject) => {
                // Create a handler which will be called by the hook so we can type it as a hook function
                const handler = ((...hookArgs: Hooks.HookParameters<K>) => {
                    done = true;
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
