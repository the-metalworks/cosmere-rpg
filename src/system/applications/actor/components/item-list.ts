import { ItemListSection } from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem } from '@system/documents/item';

// Utils
import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { getSystemSetting, SETTINGS } from '@src/system/settings';
import { ItemRelationship } from '@src/system/data/item/mixins/relationships';
import { ItemType } from '@src/system/types/cosmere';

export interface ItemState {
    expanded?: boolean;
}

export interface AdditionalItemData {
    descriptionHTML?: string;
}

export interface ItemListSectionData extends ItemListSection {
    items: CosmereItem[];
    itemData: Record<string, AdditionalItemData>;
}

interface ItemListSectionState {
    expanded?: boolean;
    hasItems?: boolean;
}

export class ActorItemListComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    protected sections: ItemListSection[] = [];

    /**
     * Map of section id to state
     */
    protected sectionState: Record<string, ItemListSectionState> = {};

    /**
     * Map of id to state
     */
    protected itemState: Record<string, ItemState> = {};

    /* --- Getters --- */
    protected get expandSectionDefaultSetting(): boolean {
        return getSystemSetting(SETTINGS.SHEET_EXPAND_SECTIONS_DEFAULT) ?? true;
    }

    /* --- Actions --- */

    protected setSectionExpandedDefaults() {
        // Ensure all sections have an expand state record defaulting to settings.expandSectionByDefault
        this.sections.forEach((section) => {
            if (!(section.id in this.sectionState)) {
                this.sectionState[section.id] = {
                    expanded: this.expandSectionDefaultSetting,
                };
            }
        });
    }

    public static onToggleSectionCollapsed(
        this: ActorItemListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();
        // Get item element
        const sectionElement = $(event.target!).closest(
            '.item-list[data-section-id]',
        );

        // Get section id
        const sectionId = sectionElement.data('section-id') as string;

        // Update the state
        this.sectionState[sectionId].expanded =
            !this.sectionState[sectionId].expanded;

        // Set classes
        sectionElement.toggleClass(
            'expanded',
            this.sectionState[sectionId].expanded,
        );

        sectionElement
            .find('a[data-action="toggle-section-collapsed"')
            .empty()
            .append(
                this.sectionState[sectionId].expanded
                    ? '<i class="fa-solid fa-compress"></i>'
                    : '<i class="fa-solid fa-expand"></i>',
            );
    }

    public static onToggleActionDetails(
        this: ActorItemListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();
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

    public static async onUseItem(this: ActorItemListComponent, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        // Get item
        const uuid = AppUtils.getItemUuidFromEvent(event);
        if (!uuid) return;

        const item = await fromUuid<CosmereItem>(uuid);
        if (!item) return;

        // Use the item
        void this.application.actor.useItem(item);
    }

    protected static async onNewItem(
        this: ActorItemListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();
        // Get section element
        const sectionElement = $(event.target!).closest('[data-section-id]');

        // Get section id
        const sectionId = sectionElement.data('section-id') as string;

        // Get section
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;

        // Create a new item
        const item = await section.new?.(this.application.actor);
        if (!item) return;

        if (item.type == ItemType.Talent) {
            if (!item.actor) return;
            for (const otherItem of item.actor.items) {
                if (otherItem.isPath() && otherItem.system.id == sectionId) {
                    await item.addRelationship(
                        otherItem,
                        ItemRelationship.Type.Parent,
                    );
                    break;
                }
            }
        }

        // Render the item sheet
        void item?.sheet?.render(true);
    }
}
