import SparkMD5 from 'spark-md5';

// Types
import { AnyObject } from '@system/types/utils';
import { CommonRegistrationData, RegistrationError } from './types';

// Constants
import { SYSTEM_ID } from '@system/constants';

interface TryRegisterConfigParams<TData extends object> {
    identifier: string;
    data: TData & CommonRegistrationData;
    register(this: void): boolean;
    hashOmitFields?: (keyof TData)[];
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

    static registerLog(log: RegistrationLog) {
        this.logs.push(log);
        this.showLogs();
    }

    static tryRegisterConfig<TData extends object>(
        params: TryRegisterConfigParams<TData>,
    ): boolean;
    static tryRegisterConfig<TData extends object>({
        identifier,
        data,
        register,
        hashOmitFields,
        compare = true,
    }: TryRegisterConfigParams<TData>) {
        data.priority ??= 0; // Default priority to 0 if not set

        try {
            // Calculate a hash of the base data to check for equality
            const hash = compare
                ? RegistrationHelper.getHash(data, hashOmitFields)
                : false;

            if (identifier in RegistrationHelper._COMPLETED) {
                // Check if same object is already registered
                if (
                    compare &&
                    hash === RegistrationHelper._COMPLETED[identifier].hash
                ) {
                    RegistrationHelper.registerLog({
                        source: data.source,
                        type: RegistrationLogType.Warn,
                        message: `Config ${identifier} already registered with the same data.`,
                    } as RegistrationLog);

                    return true; // Already registered with the same data
                }

                // If the same identifier is already registered, we check if the new registration has a higher priority.
                if (
                    data.priority <=
                    RegistrationHelper._COMPLETED[identifier].priority
                ) {
                    throw new RegistrationError(
                        'A higher priority registration already exists.',
                    );
                }

                // Log warning about overriding
                RegistrationHelper.registerLog({
                    source: data.source,
                    type: RegistrationLogType.Warn,
                    message: `Overriding config: ${identifier} due to a higher priority value: ${data.priority}.`,
                } as RegistrationLog);
            }

            // Perform the registration
            const result = register();

            if (result) {
                RegistrationHelper._COMPLETED[identifier] = {
                    source: data.source,
                    priority: data.priority,
                    hash,
                };
            }

            return result;
        } catch (err: unknown) {
            // Only handle RegistrationError, rethrow any others
            if (!(err instanceof RegistrationError)) {
                throw err;
            }

            const message = `Failed to register config: ${identifier}. Reason: ${err instanceof Error ? err.message : 'Unknown error'}`;

            if (data.strict) {
                throw new Error(message);
            }

            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Error,
                message,
            } as RegistrationLog);

            return false;
        }
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
                game.i18n!.localize('GENERIC.Error.RegisteringConfigs'),
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
