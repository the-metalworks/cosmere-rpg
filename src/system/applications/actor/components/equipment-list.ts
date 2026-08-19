import { EquipHand, ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { ItemListSection } from '@system/types/application/actor/components/item-list';
import {
    ActorItemListComponent,
    AdditionalItemData,
} from '@system/applications/actor/components/item-list';

// Documents
import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';

// Utils
import AppUtils from '@system/applications/utils';
import { AppContextMenu } from '@system/applications/utils/context-menu';

// Component imports
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { areKeysPressed } from '@src/system/utils/generic';
import { getSystemSetting, KEYBINDINGS, SETTINGS } from '@src/system/settings';

interface RenderContext extends BaseActorSheetRenderContext {
    equipmentSearch: {
        text: string;
        sort: SortMode;
    };
}

export class ActorEquipmentListComponent extends ActorItemListComponent {
    static TEMPLATE = `${TEMPLATES.DIRECTORY}${TEMPLATES.ACTOR_BASE_EQUIPMENT_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        ...super.ACTIONS,
        'toggle-equip': this.onToggleEquip,
        'cycle-equip': this.onCycleEquip,
        'decrease-quantity': this.onDecreaseQuantity,
        'increase-quantity': this.onIncreaseQuantity,
        'decrease-resource': this.onDecreaseResource,
        'increase-resource': this.onIncreaseResource,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    protected sections: ItemListSection[] = [];

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

    public static async onUseItem(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        // Get item
        const item = await AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!item) return;

        // Use the item
        void this.application.actor.rollItem(item);
    }

    public static async onToggleEquip(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        if (!this.application.isEditable) return;

        // Get item
        const item = await AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!item) return;
        if (!item.isEquippable()) return;

        void item.update({
            system: {
                equipped: !item.system.equipped,
            },
        });
    }

    public static async onCycleEquip(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        if (!this.application.isEditable) return;

        // Get item
        const item = await AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
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
            system: {
                equipped: newEquip,
                equip: {
                    hand: handTypes[newIndex],
                },
            },
        });
    }

    public static async onDecreaseQuantity(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        await this.triggerQuantityChange(event, false);
    }

    public static async onIncreaseQuantity(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        await this.triggerQuantityChange(event, true);
    }

    public static async onDecreaseResource(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        await this.triggerResourceChange(event, false);
    }

    public static async onIncreaseResource(
        this: ActorEquipmentListComponent,
        event: Event,
    ) {
        await this.triggerResourceChange(event, true);
    }

    /* --- Event handlers --- */
    private triggerCurrencyChange() {
        const event = new CustomEvent('currency', {});

        this.element!.dispatchEvent(event);
    }

    private async triggerQuantityChange(
        this: ActorEquipmentListComponent,
        event: Event,
        increase = true,
    ) {
        // Get item
        const item = await AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!item) return;
        if (!item.isPhysical()) return;

        let modifier = increase ? 1 : -1;

        if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_5)) {
            modifier *= 5;
        } else if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_10)) {
            modifier *= 10;
        } else if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_50)) {
            modifier *= 50;
        }

        await item.update(
            {
                system: {
                    quantity: item.system.quantity + modifier,
                },
            },
            { render: false },
        );
        await this.render();

        this.triggerCurrencyChange();
    }

    private async triggerResourceChange(
        this: ActorEquipmentListComponent,
        event: Event,
        increase = true,
    ) {
        // Get item
        const item = await AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!item) return;
        if (!item.hasResources()) return;
        const primaryResource = item.system.primaryResource;
        if (primaryResource === 'none') return;

        let modifier = increase ? 1 : -1;

        if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_5)) {
            modifier *= 5;
        } else if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_10)) {
            modifier *= 10;
        } else if (areKeysPressed(KEYBINDINGS.CHANGE_QUANTITY_BY_50)) {
            modifier *= 50;
        }

        const resource = item.getResource(primaryResource);
        if (!resource) return;

        const newResourceValue =
            resource.value + modifier < resource.max
                ? resource.value + modifier
                : resource.max;

        await item.update(
            {
                system: {
                    resources: {
                        [primaryResource]: {
                            value: newResourceValue,
                        },
                    },
                },
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
            if (!(item.id! in this.itemState)) {
                this.itemState[item.id!] = {
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

        // Set section expanded defaults
        this.setSectionExpandedDefaults();

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
            sectionState: this.sectionState,
            itemState: this.itemState,
        };
    }

    protected prepareSection(type: ItemType): ItemListSection {
        return {
            id: type,
            label: CONFIG.COSMERE.items.types[type].labelPlural,
            default: true,
            filter: (item) => item.type === type,
            new: (parent: CosmereActor) =>
                CosmereItem.create(
                    {
                        type,
                        name: game.i18n.localize(
                            `COSMERE.Item.Type.${type.capitalize()}.New`,
                        ),
                    },
                    { parent },
                ) as Promise<CosmereItem>,
        };
    }

    protected async prepareSectionData(
        section: ItemListSection,
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

        // Prepare "Is section empty" data
        this.sectionState[section.id].hasItems = sectionItems.length > 0;

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
                [item.id!]: {
                    ...(item.hasDescription() && item.system.description?.value
                        ? {
                              descriptionHTML: await TextEditor.enrichHTML(
                                  item.system.description.value,
                                  {
                                      relativeTo: (item as CosmereItem).system
                                          .parent as foundry.abstract.Document.Any,
                                  },
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

                    return [
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
                                    [item.id!],
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
