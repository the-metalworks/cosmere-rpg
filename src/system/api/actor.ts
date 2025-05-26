import { Skill } from '@system/types/cosmere';

import { SkillConfig } from '@system/types/config';

interface SkillConfigData extends Omit<SkillConfig, 'key'> {
    /**
     * Unique id for the skill.
     */
    id: string;
}

export function registerSkill(data: SkillConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.skills && !force)
        throw new Error('Cannot override existing skill config.');

    if (force) {
        console.warn('Registering skill with force=true.');
    }

    // Add to skills config
    CONFIG.COSMERE.skills[data.id as Skill] = {
        key: data.id,
        label: data.label,
        attribute: data.attribute,
        core: data.core,
        hiddenUntilAcquired: data.hiddenUntilAcquired,
    };

    // Add to attribute's skills list
    CONFIG.COSMERE.attributes[data.attribute].skills.push(data.id as Skill);
}
