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
import { AppContextMenu } from '@src/system/applications/utils/context-menu';

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
                : ([item, item.actions] as [CosmereItem, ActionItem[]]),
        );

        sectionActions.forEach((item) => {
            if (!Array.isArray(item)) return;

            if (item[0].id) {
                if (!(item[0].id in this.itemState)) {
                    this.itemState[item[0].id] = {
                        expanded: false,
                    };
                }
            }
        });

        return {
            ...section,
            canAddNewItems: !!section.new,
            items: sectionActions,
            itemData: await this.prepareItemData(sectionActions.flat().flat()),
        };
    }
    public _onInitialize(): void {
        if (this.application.isEditable) {
            // Create context menu
            AppContextMenu.create({
                parent: this as AppContextMenu.Parent,
                items: (element) => {
                    console.log('AppContextMenu items callback', { element });

                    // Get item uuid
                    const itemUuid = $(element)
                        .closest('.item[data-item-uuid]')
                        .data('item-uuid') as string;

                    // Get item from loaded actor sheet
                    const item =
                        this.application.actor.getEmbeddedDocumentFromUuid(
                            itemUuid,
                        );

                    if (!(item instanceof CosmereItem)) return [];

                    const menuItems = [];

                    if (item.hasResources()) {
                        menuItems.push(
                            /**
                             * NOTE: This is a TEMPORARY context menu option
                             * until we can handle recharging properly.
                             */
                            {
                                name: 'COSMERE.Item.Activation.Uses.Recharge.Label',
                                icon: 'fa-solid fa-rotate-left',
                                callback: () => {
                                    void item.recharge();
                                },
                            },
                        );
                    }

                    if (!item.isEphemeral) {
                        menuItems.push(
                            {
                                name: 'GENERIC.Button.Edit',
                                icon: 'fa-solid fa-pen-to-square',
                                callback: () => {
                                    void item.sheet?.render(true);
                                },
                            },
                            {
                                name: 'GENERIC.Button.Remove',
                                icon: 'fa-solid fa-trash',
                                callback: () => {
                                    void item.delete();
                                },
                            },
                        );
                    } else {
                        menuItems.push({
                            name: 'COSMERE.Item.Sheet.ActionsList.View',
                            icon: 'fa-solid fa-eye',
                            callback: () => {
                                void item.sheet?.render(true);
                            },
                        });
                    }

                    return menuItems.filter((i) => !!i);
                },
                selectors: ['a[data-action="toggle-actions-controls"]'],
                anchor: 'right',
            });
        }
    }
}

// Register
AdversaryActionsListComponent.register('app-adversary-actions-list');
