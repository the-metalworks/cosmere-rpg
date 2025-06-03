import { Skill } from '@system/types/cosmere';
import {
    RegistrationConfig,
    RegistrationLog,
    RegistrationLogType,
    SkillConfig,
} from '@system/types/config';
import { RegistrationHelper } from './helper';

interface SkillConfigData extends Omit<SkillConfig, 'key'> {
    /**
     * Unique id for the skill.
     */
    id: string;
}

export function registerSkill(
    data: SkillConfigData,
    options: RegistrationConfig,
) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    RegistrationHelper.registerCallback((completed, logs) => {
        const toRegister = {
            key: data.id,
            label: data.label,
            attribute: data.attribute,
            core: data.core,
            hiddenUntilAcquired: data.hiddenUntilAcquired,
        } as SkillConfig;

        const Register = () => {
            completed[data.id] = options;
            CONFIG.COSMERE.skills[data.id as Skill] = toRegister;
            CONFIG.COSMERE.attributes[data.attribute].skills.push(
                data.id as Skill,
            );
            return true;
        };

        if (data.id in CONFIG.COSMERE.skills) {
            // If the same object is already registered, we ignore the registration and mark it succesful.
            if (
                foundry.utils.objectsEqual(
                    toRegister,
                    CONFIG.COSMERE.skills[data.id as Skill],
                )
            ) {
                return true;
            }

            // If the object was registered by a previous API call, compare priorities.
            // If not, but the object still already exists, check that the priority is higher than 0 (i.e. higher than the default system config).
            // If both conditions fail, the new registration has a lower priority than either system default or any previous registration.
            // This means we can log this new registration as a failure and not register it.
            if (
                (data.id in completed &&
                    (completed[data.id].priority ?? 0) <
                        (options.priority ?? 0)) ||
                (!(data.id in completed) && (options.priority ?? 0) > 0)
            ) {
                logs.push({
                    source: options.source,
                    type: RegistrationLogType.Warn,
                    message: `Overriding Skill with ID: ${data.id} due to a higher priority value: ${options.priority}.`,
                } as RegistrationLog);

                return Register();
            } else {
                if (options.strict) {
                    throw new Error(
                        `Failed to register Skill with ID: ${data.id} due to conflicts.`,
                    );
                }

                logs.push({
                    source: options.source,
                    type: RegistrationLogType.Error,
                    message: `Failed to register Skill with ID: ${data.id} because there is already a higher priority registration.`,
                } as RegistrationLog);

                return false;
            }
        }

        return Register();
    });
}
