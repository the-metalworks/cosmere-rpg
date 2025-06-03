import { RegistrationConfig, RegistrationLog } from '../types/config';

export class RegistrationHelper {
    static REGISTER_DEBOUNCE_MS = 200;

    private static completed: Record<string, RegistrationConfig> = {};
    private static logs: RegistrationLog[] = [];
    private static queue: ((
        completed: Record<string, RegistrationConfig>,
        logs: RegistrationLog[],
    ) => boolean)[] = [];

    static registerCallback(
        callback: (
            completed: Record<string, RegistrationConfig>,
            logs: RegistrationLog[],
        ) => boolean,
    ) {
        this.queue.push(callback);
        this.runRegistrations();
    }

    private static runRegistrations = foundry.utils.debounce(() => {
        let success = true;

        for (const registration of this.queue) {
            success &&= registration(this.completed, this.logs);
        }

        if (!success) {
            //TODO DIALOG
        }

        console.log(this.completed);

        // Clear this batch of queued registrations so we don't run them again.
        this.queue = [];
    }, this.REGISTER_DEBOUNCE_MS);
}
