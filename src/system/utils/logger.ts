import { SYSTEM_ID } from '@system/constants';

export class Logger {
    static log(scope: string, ...args: unknown[]) {
        console.log(`[${SYSTEM_ID}] [${scope}]`, ...args);
    }

    static info(scope: string, ...args: unknown[]) {
        console.info(`[${SYSTEM_ID}] [${scope}]`, ...args);
    }

    static debug(scope: string, ...args: unknown[]) {
        if (!foundry.utils.getProperty(CONFIG, `debug.${scope}`)) return;
        console.debug(`[${SYSTEM_ID}] [${scope}]`, ...args);
    }

    static warn(scope: string, ...args: unknown[]) {
        console.warn(`[${SYSTEM_ID}] [${scope}]`, ...args);
    }

    static error(scope: string, ...args: unknown[]) {
        console.error(`[${SYSTEM_ID}] [${scope}]`, ...args);
    }

    public constructor(public readonly scope: string) {}

    public log(...args: unknown[]) {
        Logger.log(this.scope, ...args);
    }

    public info(...args: unknown[]) {
        Logger.info(this.scope, ...args);
    }

    public debug(...args: unknown[]) {
        Logger.debug(this.scope, ...args);
    }

    public warn(...args: unknown[]) {
        Logger.warn(this.scope, ...args);
    }

    public error(...args: unknown[]) {
        Logger.error(this.scope, ...args);
    }
}
