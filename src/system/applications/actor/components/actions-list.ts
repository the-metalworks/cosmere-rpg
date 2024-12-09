import {
    ActionType,
    ItemType,
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    Resource,
    PowerType,
} from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents';
import { ConstructorOf } from '@system/types/utils';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Utils
import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortDirection } from './search-bar';

interface ActionItemState {
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

export interface ActorActionsListComponentRenderContext
    extends BaseActorSheetRenderContext {
    actionsSearch?: {
        text: string;
        sort: SortDirection;
    };
}

// Constants
const STATIC_SECTIONS = {
    Weapons: {
        id: 'weapons',
        label: 'COSMERE.Item.Type.Weapon.label_plural',
        default: false,
        filter: (item: CosmereItem) => item.isWeapon(),
        new: (parent: CosmereActor) =>
            CosmereItem.create(
                {
                    type: ItemType.Weapon,
                    name: game.i18n!.localize('COSMERE.Item.Type.Weapon.New'),
                    system: {
                        activation: {
                            type: ActivationType.SkillTest,
                            cost: {
                                type: ActionCostType.Action,
                                value: 1,
                            },
                        },
                        equipped: true,
                    },
                },
                { parent },
            ) as Promise<CosmereItem>,
    },
    Equipment: {
        id: 'equipment',
        label: 'COSMERE.Item.Type.Equipment.label_plural',
        default: false,
        filter: (item: CosmereItem) => item.isEquipment(),
        new: (parent: CosmereActor) =>
            CosmereItem.create(
                {
                    type: ItemType.Equipment,
                    name: game.i18n!.localize(
                        'COSMERE.Item.Type.Equipment.New',
                    ),
                    system: {
                        activation: {
                            type: ActivationType.Utility,
                            cost: {
                                type: ActionCostType.Action,
                                value: 1,
                            },
                        },
                    },
                },
                { parent },
            ) as Promise<CosmereItem>,
    },
    BasicActions: {
        id: 'basic-actions',
        label: 'COSMERE.Item.Action.Type.Basic.label_plural',
        default: true,
        filter: (item: CosmereItem) =>
            item.isAction() && item.system.type === ActionType.Basic,
        new: (parent: CosmereActor) =>
            CosmereItem.create(
                {
                    type: ItemType.Action,
                    name: game.i18n!.localize('COSMERE.Item.Type.Action.New'),
                    system: {
                        type: ActionType.Basic,
                        activation: {
                            type: ActivationType.Utility,
                            cost: {
                                type: ActionCostType.Action,
                                value: 1,
                            },
                        },
                    },
                },
                { parent },
            ) as Promise<CosmereItem>,
    },

    // Section for any items that don't fit into the other categories
    MiscActions: {
        id: 'misc-actions',
        label: 'COSMERE.Actor.Sheet.Actions.MiscSectionName',
        default: false,
        filter: () => false, // Filter function is not used for this section
    },
};

export class ActorActionsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ACTIONS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-action-details': this.onToggleActionDetails,
        'use-item': this.onUseItem,
        'new-item': this.onNewItem,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    protected sections: ListSection[] = [];

    /**
     * Map of id to state
     */
    protected itemState: Record<string, ActionItemState> = {};

    /* --- Actions --- */

    public static onToggleActionDetails(
        this: ActorActionsListComponent,
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
        $(this.element!)
            .find(`.details[data-item-id="${itemId}"]`)
            .toggleClass('expanded', this.itemState[itemId].expanded);
    }

    public static onUseItem(this: ActorActionsListComponent, event: Event) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;

        // Use the item
        void this.application.actor.useItem(item);
    }

    private static async onNewItem(
        this: ActorActionsListComponent,
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

        // Render the item sheet
        void item?.sheet?.render(true);
    }

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

        const searchText = context.actionsSearch?.text ?? '';
        const sortDir = context.actionsSearch?.sort ?? SortDirection.Descending;

        // Prepare sections
        this.sections = this.prepareSections();

        // Prepare sections data
        const sectionsData = await this.prepareSectionsData(
            this.sections,
            activatableItems,
            searchText,
            sortDir,
        );

        return {
            ...context,

            sections: sectionsData.filter(
                (section) =>
                    section.items.length > 0 ||
                    (this.application.mode === 'edit' && section.default),
            ),

            itemState: this.itemState,
        };
    }

    protected prepareSections() {
        // Get paths
        const paths = this.application.actor.paths;

        // Get ancestry
        const ancestry = this.application.actor.ancestry;

        return [
            STATIC_SECTIONS.Weapons,

            ...this.preparePowersSections(),

            ...paths.map((path) => ({
                id: path.system.id,
                label: game.i18n!.format(
                    'COSMERE.Actor.Sheet.Actions.BaseSectionName',
                    {
                        type: path.name,
                    },
                ),
                default: true,
                filter: (item: CosmereItem) =>
                    item.isTalent() && item.system.path === path.system.id,
                new: (parent: CosmereActor) =>
                    CosmereItem.create(
                        {
                            type: ItemType.Talent,
                            name: game.i18n!.localize(
                                'COSMERE.Item.Type.Talent.New',
                            ),
                            system: {
                                path: path.system.id,
                                activation: {
                                    type: ActivationType.Utility,
                                    cost: {
                                        type: ActionCostType.Action,
                                        value: 1,
                                    },
                                },
                            },
                        },
                        { parent },
                    ) as Promise<CosmereItem>,
            })),

            ...(ancestry
                ? [
                      {
                          id: ancestry.system.id,
                          label: game.i18n!.format(
                              'COSMERE.Actor.Sheet.Actions.BaseSectionName',
                              {
                                  type: ancestry.name,
                              },
                          ),
                          default: false,
                          filter: (item: CosmereItem) =>
                              item.isTalent() &&
                              item.system.ancestry === ancestry.system.id,
                          new: (parent: CosmereActor) =>
                              CosmereItem.create(
                                  {
                                      type: ItemType.Talent,
                                      name: game.i18n!.localize(
                                          'COSMERE.Item.Type.Talent.New',
                                      ),
                                      system: {
                                          ancestry: ancestry.system.id,
                                          activation: {
                                              type: ActivationType.Utility,
                                              cost: {
                                                  type: ActionCostType.Action,
                                                  value: 1,
                                              },
                                          },
                                      },
                                  },
                                  { parent },
                              ) as Promise<CosmereItem>,
                      },
                  ]
                : []),

            STATIC_SECTIONS.Equipment,
            STATIC_SECTIONS.BasicActions,
            STATIC_SECTIONS.MiscActions,
        ];
    }

    protected preparePowersSections() {
        // Get powers
        const powers = this.application.actor.powers;

        // Get list of unique power types
        const powerTypes = [...new Set(powers.map((p) => p.system.type))];

        return powerTypes.map((type) => {
            // Get config
            const config = CONFIG.COSMERE.power.types[type];

            return {
                id: type,
                label: game.i18n!.localize(config.plural),
                default: false,
                filter: (item: CosmereItem) =>
                    item.isPower() && item.system.type === type,
                new: (parent: CosmereActor) =>
                    CosmereItem.create(
                        {
                            type: ItemType.Power,
                            name: game.i18n!.format(
                                'COSMERE.Item.Type.Power.New',
                                {
                                    type: game.i18n!.localize(config.label),
                                },
                            ),
                            system: {
                                type,
                                activation: {
                                    type: ActivationType.Utility,
                                    cost: {
                                        type: ActionCostType.Action,
                                        value: 1,
                                    },
                                    consume: {
                                        type: ItemConsumeType.Resource,
                                        resource: Resource.Investiture,
                                        value: 1,
                                    },
                                },
                            },
                        },
                        { parent },
                    ) as Promise<CosmereItem>,
            };
        });
    }

    protected async prepareSectionsData(
        sections: ListSection[],
        items: CosmereItem[],
        searchText: string,
        sort: SortDirection,
    ): Promise<ListSectionData[]> {
        // Filter items into sections, putting all items that don't fit into a section into a "Misc" section
        const itemsBySectionId = items.reduce(
            (result, item) => {
                const section = sections.find((s) => s.filter(item));
                if (!section) {
                    result['misc-actions'] ??= [];
                    result['misc-actions'].push(item);
                } else {
                    if (!result[section.id]) result[section.id] = [];
                    result[section.id].push(item);
                }

                return result;
            },
            {} as Record<string, CosmereItem[]>,
        );

        // Prepare sections
        return await Promise.all(
            sections.map(async (section) => {
                // Get items for section, filter by search text, and sort
                const sectionItems = (itemsBySectionId[section.id] ?? [])
                    .filter((i) => i.name.toLowerCase().includes(searchText))
                    .sort(
                        (a, b) =>
                            a.name.compare(b.name) *
                            (sort === SortDirection.Descending ? 1 : -1),
                    );

                return {
                    ...section,
                    canAddNewItems: !!section.new,
                    items: sectionItems,
                    itemData: await this.prepareItemData(sectionItems),
                };
            }),
        );
    }

    protected async prepareItemData(items: CosmereItem[]) {
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
ActorActionsListComponent.register('app-actor-actions-list');
