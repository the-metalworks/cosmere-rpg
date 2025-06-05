import {
    RegistrationConfig,
    RegistrationLog,
    RegistrationLogType,
} from '../types/config';

export class RegistrationHelper {
    static LOG_DEBOUNCE_MS = 200;
    static COMPLETED: Record<string, RegistrationConfig> = {};

    private static logs: RegistrationLog[] = [];

    static registerLog(log: RegistrationLog) {
        this.logs.push(log);
        this.showLogs();
    }

    static tryRegisterConfig(
        identifier: string,
        data: RegistrationConfig,
        callback: () => boolean,
    ) {
        // If the object was registered by a previous API call, compare priorities.
        // If not, but the object still already exists, check that the priority is higher than 0 (i.e. higher than the default system config).
        if (
            (identifier in RegistrationHelper.COMPLETED &&
                (RegistrationHelper.COMPLETED[identifier].priority ?? 0) <
                    (data.priority ?? 0)) ||
            (!(identifier in RegistrationHelper.COMPLETED) &&
                (data.priority ?? 0) > 0)
        ) {
            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Warn,
                message: `Overriding config: ${identifier} due to a higher priority value: ${data.priority}.`,
            } as RegistrationLog);

            return callback();
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
        console.log(this.logs);
        ui.notifications.error(
            game.i18n!.localize('GENERIC.Error.RegisteringConfigs'),
        );

        //TODO SHOW LOG DIALOG

        // Clear this batch of logs so we don't display them again.
        this.logs = [];
    }, this.LOG_DEBOUNCE_MS);
}
