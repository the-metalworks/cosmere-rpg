import { RegistrationConfig, RegistrationLog } from '../config';

export type RegisterConfig = (
    completed: Record<string, RegistrationConfig>,
    logs: RegistrationLog[],
) => boolean;
