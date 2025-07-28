import { Skill } from '@system/types/cosmere';
import { SkillConfig } from '@system/types/config';
import { CommonRegistrationData } from './types';
import { RegistrationHelper } from './helper';

interface SkillConfigData
    extends Omit<SkillConfig, 'key'>,
        CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        attribute: data.attribute,
        label: data.label,
        core: data.core,
        hiddenUntilAcquired: data.hiddenUntilAcquired,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const key = `skills.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.skills[data.id as Skill] = {
            key: data.id,
            label: data.label,
            attribute: data.attribute,
            core: data.core,
            hiddenUntilAcquired: data.hiddenUntilAcquired,
        };
        CONFIG.COSMERE.attributes[data.attribute].skills.push(data.id as Skill);
        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        key,
        data,
        register,
    });
}
