// Types
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
    ItemEventTypeConfig,
    PathTypeConfig,
    EquipmentTypeConfig,
    WeaponTypeConfig,
    WeaponConfig,
    ArmorConfig,
    CultureConfig,
    AncestryConfig,
    RegistrationConfig,
    RegistrationLogType,
    RegistrationLog,
    ItemEventHandlerTypeConfig,
} from '@system/types/config';
import { EventSystem as ItemEventSystem } from '@system/types/item';
import { AnyObject } from '@system/types/utils';

// Utils
import * as EventSystemUtils from '@system/utils/item/event-system';
import { RegistrationHelper } from './helper';

interface PowerTypeConfigData extends PowerTypeConfig, RegistrationConfig {
    /**
     * Unique id for the power type.
     */
    id: string;
}

export function registerPowerType(data: PowerTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `power.type.${data.id}`;

    if (data.id === 'none') {
        RegistrationHelper.registerLog({
            source: data.source,
            type: RegistrationLogType.Error,
            message: `Failed to register config: ${identifier}. Cannot register power type with id "none".`,
        } as RegistrationLog);

        return false;
    }

    const toRegister = {
        label: data.label,
        plural: data.plural,
    } as PowerTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.power.types[data.id as PowerType] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.power.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.power.types[data.id as PowerType],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface PathTypeConfigData extends PathTypeConfig, RegistrationConfig {
    /**
     * Unique id for the path type.
     */
    id: string;
}

export function registerPathType(data: PathTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `path.type.${data.id}`;

    const toRegister = {
        label: data.label,
    } as PathTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.paths.types[data.id as PathType] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.paths.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.paths.types[data.id as PathType],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface ActionTypeConfigData extends ActionTypeConfig, RegistrationConfig {
    /**
     * Unique id for the action type.
     */
    id: string;
}

export function registerActionType(data: ActionTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `action.type.${data.id}`;

    const toRegister = {
        label: data.label,
        labelPlural: data.labelPlural,
        hasMode: data.hasMode,
        subtitle: data.subtitle,
    } as ActionTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.action.types[data.id as ActionType] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.action.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.action.types[data.id as ActionType],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface EquipmentTypeConfigData
    extends EquipmentTypeConfig,
        RegistrationConfig {
    /**
     * Unique id for the equipment type.
     */
    id: string;
}

export function registerEquipmentType(data: EquipmentTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `equipment.type.${data.id}`;

    const toRegister = {
        label: data.label,
    } as EquipmentTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.items.equipment.types[data.id as EquipmentType] =
            toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.items.equipment.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.items.equipment.types[data.id as EquipmentType],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface WeaponTypeConfigData extends WeaponTypeConfig, RegistrationConfig {
    /**
     * Unique id for the weapon type.
     */
    id: string;
}

export function registerWeaponType(data: WeaponTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `weapon.type.${data.id}`;

    const toRegister = {
        label: data.label,
    } as WeaponTypeConfigData;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.items.weapon.types[data.id as WeaponType] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.items.weapon.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.items.weapon.types[data.id as WeaponType],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

/* --- Registry --- */

interface WeaponConfigData extends WeaponConfig, RegistrationConfig {
    /**
     * Unique id for the weapon.
     */
    id: string;
}

export function registerWeapon(data: WeaponConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `weapon.${data.id}`;

    const toRegister = {
        label: data.label,
        reference: data.reference,
        specialExpertise: data.specialExpertise,
    } as WeaponConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.weapons[data.id as WeaponId] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.weapons) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.weapons[data.id as WeaponId],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface ArmorConfigData extends ArmorConfig, RegistrationConfig {
    /**
     * Unique id for the armor.
     */
    id: string;
}

export function registerArmor(data: ArmorConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `armor.${data.id}`;

    const toRegister = {
        label: data.label,
        reference: data.reference,
    } as ArmorConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.armors[data.id as unknown as ArmorId] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.armors) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.armors[data.id as unknown as ArmorId],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface CultureConfigData extends CultureConfig, RegistrationConfig {
    /**
     * Unique id for the culture.
     */
    id: string;
}

export function registerCulture(data: CultureConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `culture.${data.id}`;

    const toRegister = {
        label: data.label,
        reference: data.reference,
    } as CultureConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.cultures[data.id] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.cultures) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.cultures[data.id],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface AncestryConfigData extends AncestryConfig, RegistrationConfig {
    /**
     * Unique id for the ancestry.
     */
    id: string;
}

export function registerAncestry(data: AncestryConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `ancestry.${data.id}`;

    const toRegister = {
        label: data.label,
        reference: data.reference,
    } as CultureConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.ancestries[data.id] = toRegister;
        return true;
    };

    if (data.id in CONFIG.COSMERE.ancestries) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.ancestries[data.id],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface ItemEventTypeConfigData
    extends Omit<ItemEventTypeConfig, 'host'>,
        Partial<Pick<ItemEventTypeConfig, 'host'>>,
        RegistrationConfig {
    /**
     * Unique id for the item event type.
     */
    type: string;
}

export function registerItemEventType(data: ItemEventTypeConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `item.event.type.${data.type}`;

    const toRegister = {
        label: data.label,
        description: data.description,
        hook: data.hook,
        host: data.host ?? ItemEventSystem.Event.ExecutionHost.Source,
        filter: data.filter,
        condition: data.condition,
        transform: data.transform,
    } as ItemEventTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.items.events.types[data.type] = toRegister;
        return true;
    };

    if (data.type in CONFIG.COSMERE.items.events.types) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.items.events.types[data.type],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface ItemEventHandlerConfigData extends RegistrationConfig {
    type: string;
    label: string;
    description?: string | (() => string);
    executor: ItemEventSystem.HandlerExecutor;
    config: {
        schema: foundry.data.fields.DataSchema;
    } & (
        | {
              template?: string;
          }
        | {
              render?: (data: AnyObject) => Promise<string>;
          }
    );
}

export function registerItemEventHandlerType(data: ItemEventHandlerConfigData) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `item.event.handler.${data.type}`;

    if (data.type === 'none') {
        RegistrationHelper.registerLog({
            source: data.source,
            type: RegistrationLogType.Error,
            message: `Failed to register config: ${identifier}. Cannot register item event handler with type "none".`,
        } as RegistrationLog);

        return false;
    }

    const toRegister = {
        label: data.label,
        description: data.description,
        documentClass: EventSystemUtils.constructHandlerClass(
            data.type,
            data.executor,
            data.config,
        ),
    } as ItemEventHandlerTypeConfig;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.items.events.handlers[data.type] = toRegister;
        return true;
    };

    if (data.type in CONFIG.COSMERE.items.events.handlers) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.items.events.handlers[data.type],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}
