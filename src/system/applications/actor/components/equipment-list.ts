import { EquipHand, ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ConstructorOf } from '@system/types/utils';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Utils
import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';

interface EquipmentItemState {
    expanded?: boolean;
}

interface AdditionalItemData {
    descriptionHTML?: string;
}

export interface ListSection {
    /**
     * The id of the section
     */
    id: string;

    /**
     * Nicely formatted label for the section
     */
    label: string;

    /**
     * Whether this section counts as default.
     * Default sections are always shown in edit mode, even if they are empty.
     */
    default: boolean;

    /**
     * Filter function to determine if an item should be included in this section
     */
    filter: (item: CosmereItem) => boolean;

    /**
     * Factory function to create a new item of this type
     */
    new?: (parent: CosmereActor) => Promise<CosmereItem | null | undefined>;
}

export interface ListSectionData extends ListSection {
    items: CosmereItem[];
    itemData: Record<string, AdditionalItemData>;
}

interface RenderContext extends BaseActorSheetRenderContext {
    equipmentSearch: {
        text: string;
        sort: SortMode;
    };
}

export class ActorEquipmentListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_EQUIPMENT_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-action-details': this.onToggleActionDetails,
        'use-item': this.onUseItem,
        'new-item': this.onNewItem,
        'toggle-equip': this.onToggleEquip,
        'cycle-equip': this.onCycleEquip,
        'decrease-quantity': this.onDecreaseQuantity,
        'increase-quantity': this.onIncreaseQuantity,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    protected sections: ListSection[] = [];

    /**
     * Map of id to state
     */
    private itemState: Record<string, EquipmentItemState> = {};

    /* --- Actions --- */

    public static onToggleActionDetails(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        // Get item element
        const itemElement = $(event.target!).closest('.item[data-item-id]');

        // Get item id
        const itemId = itemElement.data('item-id') as string;

        // Update the state
        this.itemState[itemId].expanded = !this.itemState[itemId].expanded;

        // Set classes
        itemElement.toggleClass('expanded', this.itemState[itemId].expanded);

        itemElement
            .find('a[data-action="toggle-action-details"')
            .empty()
            .append(
                this.itemState[itemId].expanded
                    ? '<i class="fa-solid fa-compress"></i>'
                    : '<i class="fa-solid fa-expand"></i>',
            );
    }

    public static onUseItem(this: ActorEquipmentListComponent, event: Event) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;

        // Use the item
        void this.application.actor.useItem(item);
    }

    private static async onNewItem(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        // Get section element
        const sectionElement = $(event.target!).closest('[data-section-id]');

        // Get section id
        const sectionId = sectionElement.data('section-id') as string;

        // Get section
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;

        // Create new item
        const item = await section.new?.(this.application.actor);
        if (!item) return;

        // Render the item sheet
        void item.sheet?.render(true);
    }

    public static onToggleEquip(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        if (!this.application.isEditable) return;

        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;
        if (!item.isEquippable()) return;

        void item.update({
            'system.equipped': !item.system.equipped,
        });
    }

    public static onCycleEquip(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        if (!this.application.isEditable) return;

        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;
        if (!item.isEquippable()) return;

        // Get hand types
        const handTypes = Object.keys(
            CONFIG.COSMERE.items.equip.hand,
        ) as EquipHand[];

        // Get current index
        const index = handTypes.indexOf(
            item.system.equip.hand ?? handTypes[handTypes.length - 1], // Default to last hand type, so we'll cycle to the first
        );

        const shouldEquip = !item.system.equipped;
        const shouldUnequip =
            item.system.equipped && index === handTypes.length - 1;

        const newEquip = shouldEquip || !shouldUnequip;
        const newIndex = shouldEquip ? 0 : shouldUnequip ? index : index + 1;

        // Update item
        void item.update({
            'system.equipped': newEquip,
            'system.equip.hand': handTypes[newIndex],
        });
    }

    public static async onDecreaseQuantity(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;
        if (!item.isPhysical()) return;

        await item.update(
            {
                'system.quantity': Math.max(0, item.system.quantity - 1),
            },
            { render: false },
        );
        await this.render();
    }

    public static async onIncreaseQuantity(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;
        if (!item.isPhysical()) return;

        await item.update(
            {
                'system.quantity': item.system.quantity + 1,
            },
            { render: false },
        );
        await this.render();
    }

    /* --- Context --- */

    public async _prepareContext(params: unknown, context: RenderContext) {
        // Assume all physical items are part of inventory
        const physicalItems = this.application.actor.items.filter((item) =>
            item.isPhysical(),
        );

        // Ensure all items have an expand state record
        physicalItems.forEach((item) => {
            if (!(item.id in this.itemState)) {
                this.itemState[item.id] = {
                    expanded: false,
                };
            }
        });

        // Prepare sections
        this.sections = [
            this.prepareSection(ItemType.Weapon),
            this.prepareSection(ItemType.Armor),
            this.prepareSection(ItemType.Equipment),
            this.prepareSection(ItemType.Loot),
        ];

        return {
            ...context,

            sections: await Promise.all(
                this.sections.map((section) =>
                    this.prepareSectionData(
                        section,
                        physicalItems,
                        context.equipmentSearch.text,
                        context.equipmentSearch.sort,
                    ),
                ),
            ),

            itemState: this.itemState,
        };
    }

    protected prepareSection(type: ItemType): ListSection {
        return {
            id: type,
            label: CONFIG.COSMERE.items.types[type].labelPlural,
            default: true,
            filter: (item) => item.type === type,
            new: (parent: CosmereActor) =>
                CosmereItem.create(
                    {
                        type,
                        name: game.i18n!.localize(
                            `COSMERE.Item.Type.${type.capitalize()}.New`,
                        ),
                    },
                    { parent },
                ) as Promise<CosmereItem>,
        };
    }

    protected async prepareSectionData(
        section: ListSection,
        items: CosmereItem[],
        filterText: string,
        sort: SortMode,
    ) {
        // Get items for section, filter by search text, and sort
        let sectionItems = items
            .filter(section.filter)
            .filter((i) => i.name.toLowerCase().includes(filterText));

        if (sort === SortMode.Alphabetic) {
            sectionItems = sectionItems.sort((a, b) => a.name.compare(b.name));
        }

        return {
            ...section,
            canAddNewItems: !!section.new,
            items: sectionItems,
            itemData: await this.prepareItemData(sectionItems),
        };
    }

    private async prepareItemData(items: CosmereItem[]) {
        return await items.reduce(
            async (prev, item) => ({
                ...(await prev),
                [item.id]: {
                    ...(item.hasDescription() && item.system.description?.value
                        ? {
                              descriptionHTML: await TextEditor.enrichHTML(
                                  item.system.description.value,
                              ),
                          }
                        : {}),
                },
            }),
            Promise.resolve({} as Record<string, AdditionalItemData>),
        );
    }

    /* --- Lifecycle --- */

    public _onInitialize(): void {
        if (this.application.isEditable) {
            // Create context menu
            AppContextMenu.create({
                parent: this as AppContextMenu.Parent,
                items: (element) => {
                    // Get item id
                    const itemId = $(element)
                        .closest('.item[data-item-id]')
                        .data('item-id') as string;

                    // Get item
                    const item = this.application.actor.items.get(itemId)!;

                    // Check if actor is character
                    const isCharacter = this.application.actor.isCharacter();

                    // Check if item is favorited
                    const isFavorite = item.isFavorite;

                    return [
                        // Favorite (only for characters)
                        isCharacter
                            ? isFavorite
                                ? {
                                      name: 'GENERIC.Button.RemoveFavorite',
                                      icon: 'fa-solid fa-star',
                                      callback: () => {
                                          void item.clearFavorite();
                                      },
                                  }
                                : {
                                      name: 'GENERIC.Button.Favorite',
                                      icon: 'fa-solid fa-star',
                                      callback: () => {
                                          void item.markFavorite(
                                              this.application.actor.favorites
                                                  .length,
                                          );
                                      },
                                  }
                            : null,

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
                                // Remove the item
                                void this.application.actor.deleteEmbeddedDocuments(
                                    'Item',
                                    [item.id],
                                );
                            },
                        },
                    ].filter((i) => !!i);
                },
                selectors: ['a[data-action="toggle-actions-controls"]'],
                anchor: 'right',
            });
        }
    }
}

// Register
ActorEquipmentListComponent.register('app-actor-equipment-list');
