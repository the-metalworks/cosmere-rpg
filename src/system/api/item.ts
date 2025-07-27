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
    ItemEventHandlerTypeConfig,
} from '@system/types/config';
import { EventSystem as ItemEventSystem } from '@system/types/item';
import { AnyObject } from '@system/types/utils';
import { CommonRegistrationData, RegistrationError } from './types';

// Utils
import * as EventSystemUtils from '@system/utils/item/event-system';
import { RegistrationHelper } from './helper';

interface PowerTypeConfigData extends PowerTypeConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        plural: data.plural,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `power.type.${data.id}`;

    const register = () => {
        if (data.id === 'none') {
            throw new RegistrationError(
                'Cannot register power type with id "none".',
            );
        }

        CONFIG.COSMERE.power.types[data.id as PowerType] = {
            label: data.label,
            plural: data.plural,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface PathTypeConfigData extends PathTypeConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `path.type.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.paths.types[data.id as PathType] = {
            label: data.label,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface ActionTypeConfigData
    extends ActionTypeConfig,
        CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        labelPlural: data.labelPlural,
        hasMode: data.hasMode,
        subtitle: data.subtitle,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `action.type.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.action.types[data.id as ActionType] = {
            label: data.label,
            labelPlural: data.labelPlural,
            hasMode: data.hasMode,
            subtitle: data.subtitle,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface EquipmentTypeConfigData
    extends EquipmentTypeConfig,
        CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `equipment.type.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.items.equipment.types[data.id as EquipmentType] = {
            label: data.label,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface WeaponTypeConfigData
    extends WeaponTypeConfig,
        CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        skill: data.skill,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `weapon.type.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.items.weapon.types[data.id as WeaponType] = {
            label: data.label,
            skill: data.skill,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

/* --- Registry --- */

interface WeaponConfigData extends WeaponConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        reference: data.reference,
        specialExpertise: data.specialExpertise,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `weapon.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.weapons[data.id as WeaponId] = {
            label: data.label,
            reference: data.reference,
            specialExpertise: data.specialExpertise,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface ArmorConfigData extends ArmorConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        specialExpertise: data.specialExpertise,
        reference: data.reference,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `armor.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.armors[data.id as unknown as ArmorId] = {
            label: data.label,
            reference: data.reference,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface CultureConfigData extends CultureConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        reference: data.reference,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `culture.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.cultures[data.id] = {
            label: data.label,
            reference: data.reference,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface AncestryConfigData extends AncestryConfig, CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        reference: data.reference,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `ancestry.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.ancestries[data.id] = {
            label: data.label,
            reference: data.reference,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface ItemEventTypeConfigData
    extends Omit<ItemEventTypeConfig, 'host'>,
        Partial<Pick<ItemEventTypeConfig, 'host'>>,
        CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        type: data.type,
        label: data.label,
        description: data.description,
        hook: data.hook,
        host: data.host ?? ItemEventSystem.Event.ExecutionHost.Source,
        filter: data.filter,
        condition: data.condition,
        transform: data.transform,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `item.event.type.${data.type}`;

    const register = () => {
        if (data.type === 'none') {
            throw new RegistrationError(
                'Cannot register item event type with type "none".',
            );
        }

        CONFIG.COSMERE.items.events.types[data.type] = {
            label: data.label,
            description: data.description,
            hook: data.hook,
            host: data.host!,
            filter: data.filter,
            condition: data.condition,
            transform: data.transform,
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface ItemEventHandlerConfigData extends CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        type: data.type,
        label: data.label,
        description: data.description,
        executor: data.executor,
        config: data.config,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `item.event.handler.${data.type}`;

    const register = () => {
        if (data.type === 'none') {
            throw new RegistrationError(
                'Cannot register item event handler with type "none".',
            );
        }

        CONFIG.COSMERE.items.events.handlers[data.type] = {
            label: data.label,
            description: data.description,
            documentClass: EventSystemUtils.constructHandlerClass(
                data.type,
                data.executor,
                data.config,
            ),
        };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
        compare: false, // Handlers are not compared by hash
    });
}
