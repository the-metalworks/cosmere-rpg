import { ItemListSection } from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem } from '@system/documents/item';

// Utils
import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

interface ItemState {
    expanded?: boolean;
}

interface AdditionalItemData {
    descriptionHTML?: string;
}

interface ListSectionData extends ItemListSection {
    items: CosmereItem[];
    itemData: Record<string, AdditionalItemData>;
}

interface ItemListSectionState {
    expanded?: boolean;
}

export class ActorItemListComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-section-collapsed': this.onToggleSectionCollapsed,
        'toggle-action-details': this.onToggleActionDetails,
        'use-item': this.onUseItem,
        'new-item': this.onNewItem,
    };
    protected sections: ItemListSection[] = [];

    /**
     * Map of section id to state
     */
    protected sectionState: Record<string, ItemListSectionState> = {};

    /**
     * Map of id to state
     */
    protected itemState: Record<string, ItemState> = {};

    /* --- Actions --- */

    public static onToggleSectionCollapsed(
        this: ActorItemListComponent,
        event: Event,
    ) {
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

    public static onUseItem(this: ActorItemListComponent, event: Event) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;

        // Use the item
        void this.application.actor.useItem(item);
    }

    protected static async onNewItem(
        this: ActorItemListComponent,
        event: Event,
    ) {
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

        // Render the item sheet
        void item?.sheet?.render(true);
    }
}
