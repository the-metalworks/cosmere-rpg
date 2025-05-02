// Types
import {
    Skill,
    EquipmentType,
    WeaponId,
    ArmorId,
    PathType,
    PowerType,
    ActionType,
    Theme,
} from '@system/types/cosmere';
import {
    CurrencyConfig,
    SkillConfig,
    PowerTypeConfig,
    ActionTypeConfig,
    ItemEventTypeConfig,
} from '@system/types/config';
import { Events as ItemEvents } from '@system/types/item';

// Utils
import * as EventSystemUtils from '@system/utils/item/event-system';

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

interface PathTypeConfigData {
    id: string;
    label: string;
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

interface EquipmentTypeConfigData {
    id: string;
    label: string;
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

interface WeaponConfigData {
    id: string;
    label: string;
    reference: string;
    specialExpertise?: boolean;
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

interface ArmorConfigData {
    id: string;
    label: string;
    reference: string;
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

interface CultureConfigData {
    id: string;
    label: string;
    reference: string;
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

interface AncestryConfigData {
    id: string;
    label: string;
    reference: string;
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

interface CurrencyConfigData extends CurrencyConfig {
    id: string;
}

export function registerCurrency(data: CurrencyConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.currencies && !force)
        throw new Error('Cannot override existing currency config.');

    if (force) {
        console.warn('Registering currency with force=true.');
    }

    // Ensure a base denomination is configured
    if (!data.denominations.primary.some((d) => d.base))
        throw new Error(`Currency ${data.id} must have a base denomination.`);
    if (
        data.denominations.secondary &&
        !data.denominations.secondary.some((d) => d.base)
    )
        throw new Error(
            `Secondary denominations for currency ${data.id} must have a base denomination.`,
        );

    // Get base denomination
    const baseDenomination = data.denominations.primary.find((d) => d.base)!;

    // Ensure base denomination has a unit
    if (!baseDenomination.unit)
        throw new Error(
            `Base denomination ${baseDenomination.id} for currency ${data.id} must have a unit.`,
        );

    // Add to currency config
    CONFIG.COSMERE.currencies[data.id] = {
        label: data.label,
        icon: data.icon,
        denominations: data.denominations,
    };
}

interface ThemeConfigData {
    id: string;
    label: string;
}

export function registerTheme(data: ThemeConfigData, force = false) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.id in CONFIG.COSMERE.themes && !force)
        throw new Error('Cannot override existing theme config.');

    if (force) {
        console.warn('Registering theme with force=true.');
    }

    // Add to themes config
    CONFIG.COSMERE.themes[data.id as Theme] = data.label;
}

interface ItemEventTypeConfigData
    extends Omit<ItemEventTypeConfig, 'host'>,
        Partial<Pick<ItemEventTypeConfig, 'host'>> {
    type: string;
}

export function registerItemEventType(
    data: ItemEventTypeConfigData,
    force = false,
) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.type in CONFIG.COSMERE.items.events.types && !force)
        throw new Error('Cannot override existing item event type config.');

    if (force) {
        console.warn('Registering item event type with force=true.');
    }

    // Add to item event types
    CONFIG.COSMERE.items.events.types[data.type] = {
        label: data.label,
        hook: data.hook,
        host: data.host ?? ItemEvents.Event.ExecutionHost.Owner,
        condition: data.condition,
    };
}

interface ItemEventHandlerConfigData {
    type: string;
    label: string;
    executor: ItemEvents.HandlerExecutor;
    configSchema: foundry.data.fields.DataSchema;
}

export function registerItemEventHandlerType(
    data: ItemEventHandlerConfigData,
    force = false,
) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (data.type === 'none')
        throw new Error('Cannot register item event handler with type "none".');

    if (data.type in CONFIG.COSMERE.items.events.handlers && !force)
        throw new Error('Cannot override existing item event handler type.');

    // Add to event handlers config
    CONFIG.COSMERE.items.events.handlers[data.type] = {
        label: data.label,
        documentClass: EventSystemUtils.constructHandlerClass(
            data.type,
            data.executor,
            data.configSchema,
        ),
    };
}

/* --- Default Export --- */

export default {
    registerSkill,
    registerPowerType,
    registerEquipmentType,
    registerPathType,
    registerActionType,
    registerWeapon,
    registerArmor,
    registerCulture,
    registerAncestry,
    registerCurrency,
    registerTheme,
    registerItemEventType,
    registerItemEventHandlerType,
};
