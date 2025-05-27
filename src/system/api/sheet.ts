import {
    ItemListSection,
    DynamicItemListSectionGenerator,
} from '@system/types/application/actor/components/item-list';

/**
 * Registers a new static section for the actor's actions list.
 */
export function registerActionListSection(
    data: ItemListSection,
    force = false,
) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (
        data.id in
            CONFIG.COSMERE.sheet.actor.components.actions.sections.static &&
        !force
    )
        throw new Error('Cannot override existing action list section.');

    if (force) {
        console.warn('Registering action list section with force=true.');
    }

    // Add to action list sections
    CONFIG.COSMERE.sheet.actor.components.actions.sections.static[data.id] = {
        id: data.id,
        label: data.label,
        sortOrder: data.sortOrder,
        default: data.default,
        itemTypeLabel: data.itemTypeLabel,
        createItemTooltip: data.createItemTooltip,
        filter: data.filter,
        new: data.new,
    };
}

interface ActionListDynamicSectionData {
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
    force = false,
) {
    if (!CONFIG.COSMERE)
        throw new Error('Cannot access api until after system is initialized.');

    if (
        data.id in
            CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic &&
        !force
    )
        throw new Error(
            'Cannot override existing dynamic action list section.',
        );

    if (force) {
        console.warn(
            'Registering dynamic action list section with force=true.',
        );
    }

    // Add to dynamic action list sections
    CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic[data.id] =
        data.generator;
}
