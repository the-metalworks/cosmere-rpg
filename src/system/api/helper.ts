import {
    RegistrationConfig,
    RegistrationLog,
    RegistrationLogType,
} from '../types/config';

import { SYSTEM_ID } from '@system/constants';

export class RegistrationHelper {
    static LOG_DEBOUNCE_MS = 200;
    private static _COMPLETED: Record<string, RegistrationConfig> = {};

    private static logs: RegistrationLog[] = [];

    public static get COMPLETED(): Readonly<
        Record<string, RegistrationConfig>
    > {
        return this._COMPLETED;
    }

    static registerLog(log: RegistrationLog) {
        this.logs.push(log);
        this.showLogs();
    }

    static tryRegisterConfig(
        identifier: string,
        data: RegistrationConfig,
        callback: () => boolean,
    ) {
        data.priority ??= 0; // Default priority to 0 if not set

        // If the object was registered by a previous API call, compare priorities.
        // If not, but the object still already exists, check that the priority is higher than 0 (i.e. higher than the default system config).
        if (
            !(identifier in RegistrationHelper._COMPLETED) ||
            (identifier in RegistrationHelper._COMPLETED &&
                RegistrationHelper._COMPLETED[identifier].priority! <
                    data.priority)
        ) {
            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Warn,
                message: `Overriding config: ${identifier} due to a higher priority value: ${data.priority}.`,
            } as RegistrationLog);

            // Perform the registration
            const result = callback();

            // Set as completed
            if (result) RegistrationHelper._COMPLETED[identifier] = data;

            return result;
            // If both conditions fail, the new registration has a lower priority than either system default or any previous registration.
            // This means we can log this new registration as a failure and not register it.
        } else {
            if (data.strict) {
                throw new Error(
                    `Failed to register config: ${identifier} due to conflicts.`,
                );
            }

            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Error,
                message: `Failed to register config: ${identifier} because there is already a higher priority registration.`,
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
}
