import {
    ItemType,
    ActionType,
    ActivationType,
    ActionCostType,
} from '@system/types/cosmere';
import { ItemListSection } from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem } from '@system/documents/item';
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
        // Get all activatable items (actions & items with an associated action)
        const activatableItems = this.application.actor.items
            .filter((item) => item.hasActivation())
            .filter(
                (item) =>
                    !item.isEquippable() ||
                    item.system.equipped ||
                    item.system.alwaysEquipped,
            );

        // Ensure all items have an expand state record
        activatableItems.forEach((item) => {
            if (!(item.id in this.itemState)) {
                this.itemState[item.id] = {
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

        return {
            ...context,

            sections: [
                await this.prepareSectionData(
                    this.sections[0],
                    activatableItems,
                    searchText,
                    sortMode,
                ),
                await this.prepareSectionData(
                    this.sections[1],
                    activatableItems,
                    searchText,
                    sortMode,
                ),
                await this.prepareSectionData(
                    this.sections[2],
                    activatableItems,
                    searchText,
                    sortMode,
                ),
            ].filter(
                (section) =>
                    section.items.length > 0 ||
                    (this.application.mode === 'edit' && section.default),
            ),

            itemState: this.itemState,
        };
    }

    /* --- Helpers --- */

    private prepareSection(type: ItemType): ItemListSection {
        return {
            id: type,
            label: CONFIG.COSMERE.items.types[type].labelPlural,
            default: true,
            filter: (item: CosmereItem) => item.type === type,
            new: (parent: CosmereActor) =>
                CosmereItem.create(
                    {
                        type,
                        name: game.i18n!.localize(
                            `COSMERE.Item.Type.${type.capitalize()}.New`,
                        ),
                        system: {
                            activation: {
                                type: ActivationType.Utility,
                                cost: {
                                    type: ActionCostType.Action,
                                    value: 1,
                                },
                            },

                            ...(type === ItemType.Weapon
                                ? {
                                      equipped: true,
                                  }
                                : {}),
                        },
                    },
                    { parent },
                ) as Promise<CosmereItem>,
        };
    }

    private async prepareSectionData(
        section: ItemListSection,
        items: CosmereItem[],
        searchText: string,
        sort: SortMode,
    ) {
        // Get items for section, filter by search text, and sort
        let sectionItems = items
            .filter(section.filter)
            .filter((i) => i.name.toLowerCase().includes(searchText));

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
