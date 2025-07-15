import {
    ActionType,
    ItemType,
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { Talent } from '@system/types/item';
import {
    ItemListSection,
    DynamicItemListSectionGenerator,
} from '@system/types/application/actor/components/item-list';

// Documents
import { CosmereItem } from '@system/documents/item';
import { CosmereActor } from '@system/documents/actor';
import { ItemRelationship } from '@system/data/item/mixins/relationships';

// Utils
import AppUtils from '@system/applications/utils';
import { AppContextMenu } from '@system/applications/utils/context-menu';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

interface ActionItemState {
    expanded?: boolean;
}

interface AdditionalItemData {
    descriptionHTML?: string;
}

interface ItemListSectionData extends ItemListSection {
    items: CosmereItem[];
    itemData: Record<string, AdditionalItemData>;
}

export interface ActorActionsListComponentRenderContext
    extends BaseActorSheetRenderContext {
    actionsSearch?: {
        text: string;
        sort: SortMode;
    };
}

// Constants
export const STATIC_SECTIONS: Record<string, ItemListSection> = {
    weapons: {
        id: 'weapons',
        sortOrder: 0,
        label: 'COSMERE.Item.Type.Weapon.label_plural',
        itemTypeLabel: 'COSMERE.Item.Type.Weapon.label_action',
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
    armor: {
        id: 'armor',
        sortOrder: 400,
        label: 'COSMERE.Item.Type.Armor.label_plural',
        itemTypeLabel: 'COSMERE.Item.Type.Armor.label_action',
        default: false,
        filter: (item: CosmereItem) => item.isArmor(),
        new: (parent: CosmereActor) =>
            CosmereItem.create(
                {
                    type: ItemType.Equipment,
                    name: game.i18n!.localize('COSMERE.Item.Type.Armor.New'),
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
    equipment: {
        id: 'equipment',
        sortOrder: 500,
        label: 'COSMERE.Item.Type.Equipment.label_plural',
        itemTypeLabel: 'COSMERE.Item.Type.Equipment.label_action',
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
    'basic-actions': {
        id: 'basic-actions',
        sortOrder: 600,
        label: 'COSMERE.Item.Action.Type.Basic.label_plural',
        itemTypeLabel: 'COSMERE.Item.Action.Type.Basic.label_action',
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
};

export const DYNAMIC_SECTIONS: Record<string, DynamicItemListSectionGenerator> =
    {
        powers: (actor: CosmereActor) => {
            // Get powers
            const powers = actor.powers;

            // Get list of unique power types
            const powerTypes = [...new Set(powers.map((p) => p.system.type))];

            return powerTypes.map((type) => {
                // Get config
                const config = CONFIG.COSMERE.power.types[type];

                return {
                    id: type,
                    sortOrder: 100,
                    label: game.i18n!.localize(config.plural),
                    itemTypeLabel: game.i18n!.localize(config.label),
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
                } as ItemListSection;
            });
        },
        paths: (actor: CosmereActor) => {
            // Get paths
            const paths = actor.paths;

            return paths.map((path) => ({
                id: path.system.id,
                sortOrder: 200,
                label: game.i18n!.format(
                    'COSMERE.Actor.Sheet.Actions.BaseSectionName',
                    {
                        type: path.name,
                    },
                ),
                itemTypeLabel: `${path.name} ${game.i18n?.localize('COSMERE.Item.Type.Action.label')}`,
                default: true,
                filter: (item: CosmereItem) =>
                    item.hasRelationships() &&
                    item.isRelatedTo(path, ItemRelationship.Type.Parent),
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
            }));
        },
        ancestry: (actor: CosmereActor) => {
            // Get ancestry
            const ancestry = actor.ancestry;

            if (!ancestry) return [];

            return [
                {
                    id: ancestry.system.id,
                    sortOrder: 300,
                    label: game.i18n!.format(
                        'COSMERE.Actor.Sheet.Actions.BaseSectionName',
                        {
                            type: ancestry.name,
                        },
                    ),
                    itemTypeLabel: `${ancestry.name} ${game.i18n?.localize('COSMERE.Item.Type.Action.label')}`,
                    default: false,
                    filter: (item: CosmereItem) =>
                        (item.hasRelationships() &&
                            item.isRelatedTo(
                                ancestry,
                                ItemRelationship.Type.Parent,
                            )) ||
                        (item.isAction() &&
                            item.system.type === ActionType.Ancestry &&
                            item.system.ancestry === ancestry.system.id),
                    new: (parent: CosmereActor) =>
                        CosmereItem.create(
                            {
                                type: ItemType.Action,
                                name: game.i18n!.localize(
                                    'COSMERE.Item.Type.Action.New',
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
            ];
        },
    };

const MISC_SECTION: ItemListSection = {
    id: 'misc-actions',
    label: 'COSMERE.Actor.Sheet.Actions.MiscSectionName',
    default: false,
    filter: () => false, // Filter function is not used for this section
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

    protected sections: ItemListSection[] = [];

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

        itemElement
            .find('a[data-action="toggle-action-details"')
            .empty()
            .append(
                this.itemState[itemId].expanded
                    ? '<i class="fa-solid fa-compress"></i>'
                    : '<i class="fa-solid fa-expand"></i>',
            );
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
        const sortMode = context.actionsSearch?.sort ?? SortMode.Alphabetic;

        // Prepare sections
        this.sections = this.prepareSections();

        // Prepare sections data
        const sectionsData = await this.prepareSectionsData(
            this.sections,
            activatableItems,
            searchText,
            sortMode,
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
        return [
            ...Object.values(
                CONFIG.COSMERE.sheet.actor.components.actions.sections.static,
            ),
            ...Object.values(
                CONFIG.COSMERE.sheet.actor.components.actions.sections.dynamic,
            ).flatMap((gen) => gen(this.application.actor)),
            MISC_SECTION,
        ].sort(
            (a, b) =>
                (a.sortOrder ?? Number.MAX_VALUE) -
                (b.sortOrder ?? Number.MAX_VALUE),
        );
    }

    protected async prepareSectionsData(
        sections: ItemListSection[],
        items: CosmereItem[],
        searchText: string,
        sort: SortMode,
    ): Promise<ItemListSectionData[]> {
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
                let sectionItems = (itemsBySectionId[section.id] ?? []).filter(
                    (i) => i.name.toLowerCase().includes(searchText),
                );

                if (sort === SortMode.Alphabetic) {
                    sectionItems = sectionItems.sort((a, b) =>
                        a.name.compare(b.name),
                    );
                }

                return {
                    ...section,
                    canAddNewItems: !!section.new,
                    createItemTooltip: section.createItemTooltip
                        ? typeof section.createItemTooltip === 'function'
                            ? section.createItemTooltip()
                            : section.createItemTooltip
                        : game.i18n!.format(
                              'COSMERE.Actor.Sheet.Actions.NewItem',
                              {
                                  type: game.i18n!.localize(
                                      section.itemTypeLabel ??
                                          'COSMERE.Item.Type.Action.label',
                                  ),
                              },
                          ),
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

// Register component
ActorActionsListComponent.register('app-actor-actions-list');

export function configure() {
    // Register static sections
    Object.values(STATIC_SECTIONS).forEach((section) => {
        cosmereRPG.api.registerActionListSection({
            ...section,
            source: SYSTEM_ID,
        });
    });

    // Register dynamic sections
    Object.values(DYNAMIC_SECTIONS).forEach((gen) => {
        cosmereRPG.api.registerActionListDynamicSectionGenerator({
            source: SYSTEM_ID,
            id: gen.name,
            generator: gen,
        });
    });
}
