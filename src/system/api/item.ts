import {
    EquipmentType,
    WeaponId,
    ArmorId,
    PathType,
    PowerType,
    ActionType,
    WeaponType,
} from '@system/types/cosmere';

import {
    PowerTypeConfig,
    ActionTypeConfig,
    PathTypeConfig,
    EquipmentTypeConfig,
    WeaponTypeConfig,
    WeaponConfig,
    ArmorConfig,
    CultureConfig,
    AncestryConfig,
} from '@system/types/config';

interface PowerTypeConfigData extends PowerTypeConfig {
    /**
     * Unique id for the power type.
     */
    id: string;
}

export function registerPowerType(data: PowerTypeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.power.types && !force)
        throw new Error('Cannot override existing power type config.');

    if (force) {
        console.warn('Registering power type with force=true.');
    }

    if (data.id === 'none') {
        throw new Error('Cannot register power type with id "none".');
    }

    // Add to power types
    CONFIG.COSMERE.power.types[data.id as PowerType] = {
        label: data.label,
        plural: data.plural,
    };
}

interface PathTypeConfigData extends PathTypeConfig {
    /**
     * Unique id for the path type.
     */
    id: string;
}

export function registerPathType(data: PathTypeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.armors && !force)
        throw new Error('Cannot override existing path type config.');

    if (force) {
        console.warn('Registering path type with force=true.');
    }

    // Add to path config
    CONFIG.COSMERE.paths.types[data.id as PathType] = {
        label: data.label,
    };
}

interface ActionTypeConfigData extends ActionTypeConfig {
    /**
     * Unique id for the action type.
     */
    id: string;
}

export function registerActionType(data: ActionTypeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.action.types && !force)
        throw new Error('Cannot override existing action type config.');

    if (force) {
        console.warn('Registering action type with force=true.');
    }

    // Add to action types
    CONFIG.COSMERE.action.types[data.id as ActionType] = {
        label: data.label,
        labelPlural: data.labelPlural,
        hasMode: data.hasMode,
        subtitle: data.subtitle,
    };
}

interface EquipmentTypeConfigData extends EquipmentTypeConfig {
    /**
     * Unique id for the equipment type.
     */
    id: string;
}

export function registerEquipmentType(
    data: EquipmentTypeConfigData,
    force = false,
) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.items.equipment.types && !force)
        throw new Error('Cannot override existing equipment type config.');

    if (force) {
        console.warn('Registering equipment type with force=true.');
    }

    // Add to equipment types
    CONFIG.COSMERE.items.equipment.types[data.id as EquipmentType] = {
        label: data.label,
    };
}

interface WeaponTypeConfigData extends WeaponTypeConfig {
    /**
     * Unique id for the weapon type.
     */
    id: string;
}

export function registerWeaponType(data: WeaponTypeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.items.weapon.types && !force)
        throw new Error('Cannot override existing weapon type config.');

    if (force) {
        console.warn('Registering weapon type with force=true.');
    }

    // Add to weapon types
    CONFIG.COSMERE.items.weapon.types[data.id as WeaponType] = {
        label: data.label,
    };
}

/* --- Registry --- */

interface WeaponConfigData extends WeaponConfig {
    /**
     * Unique id for the weapon.
     */
    id: string;
}

export function registerWeapon(data: WeaponConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.weapons && !force)
        throw new Error('Cannot override existing weapon config.');

    if (force) {
        console.warn('Registering weapon with force=true.');
    }

    // Add to weapons config
    CONFIG.COSMERE.weapons[data.id as WeaponId] = {
        label: data.label,
        reference: data.reference,
        specialExpertise: data.specialExpertise,
    };
}

interface ArmorConfigData extends ArmorConfig {
    /**
     * Unique id for the armor.
     */
    id: string;
}

export function registerArmor(data: ArmorConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.armors && !force)
        throw new Error('Cannot override existing armor config.');

    if (force) {
        console.warn('Registering armor with force=true.');
    }

    // Add to armors config
    CONFIG.COSMERE.armors[data.id as unknown as ArmorId] = {
        label: data.label,
        reference: data.reference,
    };
}

interface CultureConfigData extends CultureConfig {
    /**
     * Unique id for the culture.
     */
    id: string;
}

export function registerCulture(data: CultureConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.armors && !force)
        throw new Error('Cannot override existing culture config.');

    if (force) {
        console.warn('Registering culture with force=true.');
    }

    // Add to cultures config
    CONFIG.COSMERE.cultures[data.id] = {
        label: data.label,
        reference: data.reference,
    };
}

interface AncestryConfigData extends AncestryConfig {
    /**
     * Unique id for the ancestry.
     */
    id: string;
}

export function registerAncestry(data: AncestryConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.armors && !force)
        throw new Error('Cannot override existing ancestry config.');

    if (force) {
        console.warn('Registering ancestry with force=true.');
    }

    // Add to ancestry config
    CONFIG.COSMERE.ancestries[data.id] = {
        label: data.label,
        reference: data.reference,
    };
}
