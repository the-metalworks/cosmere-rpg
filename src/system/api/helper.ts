import SparkMD5, { hash } from 'spark-md5';

// Types
import { CommonRegistrationData } from './types';

// Constants
import { SYSTEM_ID } from '@system/constants';
const SYSTEM_REGISTRATION = {
    source: SYSTEM_ID,
    priority: 0,
    hash: false,
};

interface TryRegisterConfigParams<TData extends object> {
    key: string;
    data: TData & CommonRegistrationData;
    register(this: void): boolean | void;
    compareOmitFields?: (keyof TData)[];
    /**
     * @default true
     */
    compare?: boolean;
}

interface RegistrationRecord {
    source: string;
    priority: number;
    hash: string | false; // False if hash comparison is not used
}

export interface RegistrationLog {
    source: string;
    type: RegistrationLogType;
    message: string;
}

export enum RegistrationLogType {
    Warn = 'warn',
    Error = 'error',
    Debug = 'debug',
}

export class RegistrationHelper {
    static LOG_DEBOUNCE_MS = 200;
    private static _COMPLETED: Record<string, RegistrationRecord> = {};

    private static logs: RegistrationLog[] = [];

    public static get COMPLETED(): Readonly<
        Record<string, RegistrationRecord>
    > {
        return this._COMPLETED;
    }

    static logger = {
        debug: (source: string, message: string) => {
            this.registerLog({
                source,
                type: RegistrationLogType.Debug,
                message,
            });
        },
        warn: (source: string, message: string) => {
            this.registerLog({
                source,
                type: RegistrationLogType.Warn,
                message,
            });
        },
        error: (source: string, message: string) => {
            this.registerLog({
                source,
                type: RegistrationLogType.Error,
                message,
            });
        },
    };

    static registerLog(log: RegistrationLog) {
        this.logs.push(log);
        this.showLogs();
    }

    static tryRegisterConfig<TData extends object>(
        params: TryRegisterConfigParams<TData>,
    ): boolean;
    static tryRegisterConfig<TData extends object>({
        key,
        data,
        register,
        compareOmitFields,
        compare = true,
    }: TryRegisterConfigParams<TData>) {
        data.priority ??= 0; // Default priority to 0 if not set

        // Calculate a hash of the base data to check for equality
        const hash = compare
            ? RegistrationHelper.getHash(data, compareOmitFields)
            : false;

        if (foundry.utils.hasProperty(CONFIG.COSMERE, key)) {
            const registration =
                RegistrationHelper._COMPLETED[key] ?? SYSTEM_REGISTRATION;

            /**
             * NOTE: Default system configurations (such as skills.ath) have
             * Their hash set to `false`, so similarity check always fails.
             * Modules shouldn't be using the api to set a system configuration to
             * its default value, so this has no actual effect on registrations.
             */

            // Check if same object is already registered
            if (compare && hash === registration.hash) {
                RegistrationHelper.logger.warn(
                    data.source,
                    `Config ${key} already registered with the same data.`,
                );
                return true; // Already registered with the same data
            }

            // If the same key is already registered, we check if the new registration has a higher priority.
            if (data.priority <= registration.priority) {
                RegistrationHelper.logger.error(
                    data.source,
                    `Failed to register config: ${key}. Reason: A higher priority registration already exists.`,
                );
                return false; // Registration failed due to lower priority
            }

            // Log warning about overriding
            RegistrationHelper.logger.warn(
                data.source,
                `Overriding config: ${key} due to a higher priority value: ${data.priority}.`,
            );
        }

        // Perform the registration
        const result = register();

        if (result) {
            RegistrationHelper._COMPLETED[key] = {
                source: data.source,
                priority: data.priority,
                hash,
            };
        }

        return result;
    }

    private static showLogs = foundry.utils.debounce(() => {
        const hasErrorLogs = this.logs.some(
            (log) => log.type === RegistrationLogType.Error,
        );

        console[hasErrorLogs ? 'error' : 'warn'](
            `${SYSTEM_ID} | API Registration Logs`,
            this.logs,
        );

        // Show error notification if there are any error logs
        if (hasErrorLogs) {
            // TODO: Show log dialog instead of error notification.
            ui.notifications.error(
                game.i18n.localize('GENERIC.Error.RegisteringConfigs'),
            );
        }

        // Clear this batch of logs so we don't display them again.
        this.logs = [];
    }, this.LOG_DEBOUNCE_MS);

    private static getHash<TData extends object>(
        data: TData & CommonRegistrationData,
        omitFields: (keyof TData)[] = [],
    ): string {
        const removeFields: (keyof TData | keyof CommonRegistrationData)[] = [
            ...omitFields,
            'source',
            'priority',
        ];

        const baseData = foundry.utils.duplicate(data) as Partial<
            TData & CommonRegistrationData
        >;
        removeFields.forEach((field) => {
            delete baseData[field];
        });

        return SparkMD5.hash(JSON.stringify(baseData));
    }
}
