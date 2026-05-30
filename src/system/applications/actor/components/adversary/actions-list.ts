import {
    ItemType,
    ActionType,
    ActivationType,
    ActionCostType,
} from '@system/types/cosmere';
import { ItemListSection } from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem, type ActionItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';

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
        // Get all actions
        const actions = Array.from(this.application.actor.items).flatMap(
            (item) => (item.isAction() ? [item] : item.actions),
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
                await this.prepareSectionData(
                    this.sections[0],
                    actions,
                    searchText,
                    sortMode,
                ),
                await this.prepareSectionData(
                    this.sections[1],
                    actions,
                    searchText,
                    sortMode,
                ),
                await this.prepareSectionData(
                    this.sections[2],
                    actions,
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
                item.parent instanceof CosmereItem &&
                item.parent.isTyped() &&
                item.parent.system.type === type,
        };
    }

    private async prepareSectionData(
        section: ItemListSection,
        items: ActionItem[],
        searchText: string,
        sort: SortMode,
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

        return {
            ...section,
            canAddNewItems: !!section.new,
            items: sectionItems,
            itemData: await this.prepareItemData(sectionItems),
        };
    }
}

// Register
AdversaryActionsListComponent.register('app-adversary-actions-list');
