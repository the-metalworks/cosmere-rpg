import { ItemType } from '@system/types/cosmere';
import { ItemListSection } from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem, type ActionItem } from '@system/documents/item';

// Components
import {
    ActorActionsListComponent,
    ActorActionsListComponentRenderContext,
} from '../actions-list';
import { SortMode } from '../search-bar';

// Constants

export class AdversaryActionsListComponent extends ActorActionsListComponent {
    /* --- Context --- */

    public async _prepareContext(
        params: unknown,
        context: ActorActionsListComponentRenderContext,
    ) {
        // Get all candidate items (actions, items with actions, and traits)
        const candidateItems = Array.from(this.application.actor.items).filter(
            (item) => item.isAction() || item.hasActions || item.isTrait(),
        );

        // Get all actions
        const actions = candidateItems.flatMap((item) =>
            item.isAction() ? [item] : item.actions,
        );

        // Ensure all items have an expand state record
        actions.forEach((item) => {
            if (!(item.id! in this.itemState)) {
                this.itemState[item.id!] = {
                    expanded: false,
                };
            }
        });

        // Prepare sections
        this.sections = [
            this.prepareSection(ItemType.Trait),
            this.prepareSection(ItemType.Weapon),
            this.prepareSection(ItemType.Action),
        ];

        const searchText = context.actionsSearch?.text ?? '';
        const sortMode = context.actionsSearch?.sort ?? SortMode.Alphabetic;

        // Set section expanded defaults
        this.setSectionExpandedDefaults();

        return {
            ...context,

            sections: [
                // Traits
                await this.prepareSectionData(
                    this.sections[0],
                    candidateItems,
                    searchText,
                    sortMode,
                    true,
                ),
                // Weapons
                await this.prepareSectionData(
                    this.sections[1],
                    candidateItems,
                    searchText,
                    sortMode,
                ),
                // Actions
                await this.prepareSectionData(
                    this.sections[2],
                    candidateItems,
                    searchText,
                    sortMode,
                ),
            ].filter(
                (section) =>
                    section.items.length > 0 ||
                    (this.application.mode === 'edit' && section.default),
            ),
            sectionState: this.sectionState,
            itemState: this.itemState,
        };
    }

    /* --- Helpers --- */

    private prepareSection(type: ItemType): ItemListSection {
        return {
            id: type,
            label: CONFIG.COSMERE.items.types[type].labelPlural,
            default: true,
            filter: (item: CosmereItem) =>
                // the item itself needs to be checked now, not its parent
                // and it seems the type is directly on the item rather than in its system
                item.type === type,
        };
    }

    private async prepareSectionData(
        section: ItemListSection,
        items: CosmereItem[],
        searchText: string,
        sort: SortMode,
        allowNonActions = false,
    ) {
        // Get items for section, filter by search text, and sort
        let sectionItems = items
            .filter(section.filter)
            .filter((i) => i.name.toLowerCase().includes(searchText));

        // Prepare "Is section empty" data
        this.sectionState[section.id].hasItems = sectionItems.length > 0;

        if (sort === SortMode.Alphabetic) {
            sectionItems = sectionItems.sort(
                (a, b) => a.name.compare(b.name) * -1,
            );
        }

        const sectionActions = sectionItems.map((item) =>
            item.isAction() || (allowNonActions && item.actions.length === 0)
                ? item
                : item.actions.length === 1
                  ? item.actions[0]
                  : ([item, item.actions] as [CosmereItem, ActionItem[]]),
        );

        return {
            ...section,
            canAddNewItems: !!section.new,
            items: sectionActions,
            itemData: await this.prepareItemData(
                sectionActions
                    .flat()
                    .flat()
                    .filter((item) => item.isAction()),
            ),
        };
    }
}

// Register
AdversaryActionsListComponent.register('app-adversary-actions-list');
