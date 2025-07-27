import {
    ItemListSection,
    DynamicItemListSectionGenerator,
} from '@system/types/application/actor/components/item-list';
import { CommonRegistrationData } from './types';
import { RegistrationHelper } from './helper';

/**
 * Registers a new static section for the actor's actions list.
 */
export function registerActionListSection(
    data: ItemListSection & CommonRegistrationData,
) {
    if (!CONFIG.COSMERE) {
        throw new Error(
            'Cannot access API until after the system is initialized.',
        );
    }

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        label: data.label,
        sortOrder: data.sortOrder,
        default: data.default,
        itemTypeLabel: data.itemTypeLabel,
        createItemTooltip: data.createItemTooltip,
        filter: data.filter,
        new: data.new,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `action.section.static.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.sheet.actor.components.actions.sections.static[data.id] =
            {
                id: data.id,
                label: data.label,
                sortOrder: data.sortOrder,
                default: data.default,
                itemTypeLabel: data.itemTypeLabel,
                createItemTooltip: data.createItemTooltip,
                filter: data.filter,
                new: data.new,
            };

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}

interface ActionListDynamicSectionData extends CommonRegistrationData {
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

    // Clean data, remove fields that are not part of the config
    data = {
        id: data.id,
        generator: data.generator,
        source: data.source,
        priority: data.priority,
        strict: data.strict,
    };

    const identifier = `action.section.dynamic.${data.id}`;

    const register = () => {
        CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic[
            data.id
        ] = data.generator;

        return true;
    };

    return RegistrationHelper.tryRegisterConfig({
        identifier,
        data,
        register,
    });
}
