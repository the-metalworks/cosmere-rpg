export interface CommonRegistrationData {
    /**
     * Module id of the source registering the data.
     */
    source: string;

    /**
     * Priority of the registration. Higher values indicate higher priority.
     * If two registrations have the same identifier, the one with the higher priority will be used.
     *
     * @default 0
     */
    priority?: number;

    /**
     * If true, the registration will throw an error if it fails.
     * If false, it will log an error but continue execution.
     */
    strict?: boolean;
}

export class RegistrationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RegistrationError';
    }
}
