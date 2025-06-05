import {
    ItemListSection,
    DynamicItemListSectionGenerator,
} from '@system/types/application/actor/components/item-list';
import { RegistrationConfig } from '../types/config';
import { RegistrationHelper } from './helper';

/**
 * Registers a new static section for the actor's actions list.
 */
export function registerActionListSection(
    data: ItemListSection & RegistrationConfig,
) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `action.section.static.${data.id}`;

    const toRegister = {
        id: data.id,
        label: data.label,
        sortOrder: data.sortOrder,
        default: data.default,
        itemTypeLabel: data.itemTypeLabel,
        createItemTooltip: data.createItemTooltip,
        filter: data.filter,
        new: data.new,
    } as ItemListSection;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.sheet.actor.components.actions.sections.static[data.id] =
            toRegister;
        return true;
    };

    if (
        data.id in CONFIG.COSMERE.sheet.actor.components.actions.sections.static
    ) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.sheet.actor.components.actions.sections.static[
                    data.id
                ],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}

interface ActionListDynamicSectionData extends RegistrationConfig {
    /**
     * Unique id for the type of dynamic section.
     */
    id: string;

    /**
     * The generator function for this type of dynamic section.
     */
    generator: DynamicItemListSectionGenerator;
}

/**
 * Registers a new dynamic section generator for the actor's actions list.
 * Dynamic section generators are used to create sections based on the actor's state, such as powers or paths.
 */
export function registerActionListDynamicSectionGenerator(
    data: ActionListDynamicSectionData,
) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    const identifier = `action.section.dynamic.${data.id}`;

    const toRegister = data.generator;

    const register = () => {
        RegistrationHelper.COMPLETED[identifier] = data;
        CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic[
            data.id
        ] = toRegister;
        return true;
    };

    if (
        data.id in
        CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic
    ) {
        // If the same object is already registered, we ignore the registration and mark it succesful.
        if (
            foundry.utils.objectsEqual(
                toRegister,
                CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic[
                    data.id
                ],
            )
        ) {
            return true;
        }

        return RegistrationHelper.tryRegisterConfig(identifier, data, register);
    }

    return register();
}
