import { RegistrationConfig, RegistrationLog } from '../types/config';

export class RegistrationHelper {
    static LOG_DEBOUNCE_MS = 200;
    static COMPLETED: Record<string, RegistrationConfig> = {};

    private static logs: RegistrationLog[] = [];

    static registerLog(log: RegistrationLog) {
        this.logs.push(log);
        this.showLogs();
    }

    private static showLogs = foundry.utils.debounce(() => {
        console.log(this.COMPLETED);
        console.log(this.logs);

        //TODO SHOW LOG DIALOG

        // Clear this batch of logs so we don't display them again.
        this.logs = [];
    }, this.LOG_DEBOUNCE_MS);
}
