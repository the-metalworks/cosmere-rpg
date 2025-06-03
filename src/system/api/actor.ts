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

export function registerSkill(data: SkillConfigData & RegistrationConfig) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const tag = `skill.${data.id}`;

    const toRegister = {
        key: data.id,
        label: data.label,
        attribute: data.attribute,
        core: data.core,
        hiddenUntilAcquired: data.hiddenUntilAcquired,
    } as SkillConfig;

    const Register = () => {
        RegistrationHelper.COMPLETED[tag] = data;
        CONFIG.COSMERE.skills[data.id as Skill] = toRegister;
        CONFIG.COSMERE.attributes[data.attribute].skills.push(data.id as Skill);
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
            (tag in RegistrationHelper.COMPLETED &&
                (RegistrationHelper.COMPLETED[tag].priority ?? 0) <
                    (data.priority ?? 0)) ||
            (!(tag in RegistrationHelper.COMPLETED) && (data.priority ?? 0) > 0)
        ) {
            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Warn,
                message: `Overriding Skill with ID: ${data.id} due to a higher priority value: ${data.priority}.`,
            } as RegistrationLog);

            return Register();
        } else {
            if (data.strict) {
                throw new Error(
                    `Failed to register Skill with ID: ${data.id} due to conflicts.`,
                );
            }

            RegistrationHelper.registerLog({
                source: data.source,
                type: RegistrationLogType.Error,
                message: `Failed to register Skill with ID: ${data.id} because there is already a higher priority registration.`,
            } as RegistrationLog);

            return false;
        }
    }

    return Register();
}
