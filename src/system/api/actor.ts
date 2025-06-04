import { Skill } from '@system/types/cosmere';
import { RegistrationConfig, SkillConfig } from '@system/types/config';
import { RegistrationHelper } from './helper';

interface SkillConfigData extends Omit<SkillConfig, 'key'>, RegistrationConfig {
    /**
     * Unique id for the skill.
     */
    id: string;
}

export function registerSkill(data: SkillConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `skill.${data.id}`;

    const toRegister = {
        key: data.id,
        label: data.label,
        attribute: data.attribute,
        core: data.core,
        hiddenUntilAcquired: data.hiddenUntilAcquired,
    } as SkillConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
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

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}
