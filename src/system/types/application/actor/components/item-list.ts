import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';

export interface ItemListSection {
    /**
     * The id of the section
     */
    id: string;

    /**
     * Nicely formatted label for the section
     */
    label: string;

    /**
     * The sort order of this section.
     * Sections are sorted by this value, with lower values appearing first.
     * If two sections have the same sort order, they will be sorted by which was defined first.
     */
    sortOrder?: number;

    /**
     * Whether this section counts as default.
     * Default sections are always shown in edit mode, even if they are empty.
     */
    default: boolean;

    /**
     * The label for the item type in this section.
     * This is used to generate the tooltip for the "+" button.
     * If `createItemTooltip` is provided, this will not be used.
     */
    itemTypeLabel?: string;

    /**
     * The tooltip text for the "+" button in this section.
     * Disables the use of `itemTypeLabel`.
     */
    createItemTooltip?: string | (() => string);

    /**
     * Filter function to determine if an item should be included in this section
     */
    filter: (item: CosmereItem) => boolean;

    /**
     * Factory function to create a new item of this type
     */
    new?: (parent: CosmereActor) => Promise<CosmereItem | null | undefined>;
}

export type DynamicItemListSectionGenerator = (
    actor: CosmereActor,
) => ItemListSection[];
