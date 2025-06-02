// Constants
import { SYSTEM_ID } from '@system/constants';

export class InvalidHookError extends Error {
    constructor(eventType: string, hook: string, message = '') {
        super(
            `[${SYSTEM_ID}] Invalid hook "${hook}" for event "${eventType}"${message ? `. ${message}` : ''}`,
        );
        this.name = 'InvalidHookError';
    }
}
