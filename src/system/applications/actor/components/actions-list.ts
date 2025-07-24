import { ActionType, ItemType } from '@system/types/cosmere';
import { CosmereItem, TalentItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

import { AppContextMenu } from '@system/applications/utils/context-menu';

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

export interface ActorActionsListComponentRenderContext
    extends BaseActorSheetRenderContext {
    actionsSearch?: {
        text: string;
        sort: SortDirection;
    };
}

export class ActorActionsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/actors/components/actions-list.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-action-details': this.onToggleActionDetails,
        'use-item': this.onUseItem,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

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

    /* --- Context --- */

    public async _prepareContext(
        params: unknown,
        context: ActorActionsListComponentRenderContext,
    ) {
        // Get action types
        const actionTypes = Object.keys(
            CONFIG.COSMERE.action.types,
        ) as ActionType[];

        // Get all activatable items (actions & items with an associated action)
        const activatableItems = this.application.actor.items
            .filter((item) => item.hasActivation())
            .filter(
                (item) =>
                    !item.isEquippable() ||
                    item.system.equipped ||
                    item.system.alwaysEquipped,
            );

        // Get all items that are not actions or talents (but are activatable, e.g. weapons)
        const nonActionItems = activatableItems.filter(
            (item) => !item.isAction() && !item.isTalent(),
        );

        // Get talent items
        const talentItems = activatableItems.filter((item) => item.isTalent());

        // Get action items
        const actionItems = activatableItems.filter((item) => item.isAction());

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

        return {
            ...context,

            sections: [
                ...(await this.categorizeItemsByType(
                    nonActionItems,
                    searchText,
                    sortDir,
                )),
                ...(await this.prepareTalentsData(
                    talentItems,
                    searchText,
                    sortDir,
                )),
                ...(
                    await Promise.all(
                        actionTypes.map(async (type) => {
                            const items = actionItems
                                .filter((i) => i.system.type === type)
                                .filter((i) =>
                                    i.name.toLowerCase().includes(searchText),
                                )
                                .sort(
                                    (a, b) =>
                                        a.name.compare(b.name) *
                                        (sortDir === SortDirection.Descending
                                            ? 1
                                            : -1),
                                );

                            return {
                                id: type,
                                label: CONFIG.COSMERE.action.types[type]
                                    .labelPlural,
                                items,
                                itemData: await this.prepareItemData(items),
                            };
                        }),
                    )
                ).filter((section) => section.items.length > 0),
            ],

            itemState: this.itemState,
        };
    }

    protected async categorizeItemsByType(
        items: CosmereItem[],
        filterText: string,
        sort: SortDirection,
    ) {
        // Get item types
        const types = Object.keys(CONFIG.COSMERE.items.types) as ItemType[];

        // Categorize items by types
        const categories = types.reduce(
            (result, type) => {
                // Get all physical items of type
                result[type] = items
                    .filter((item) => item.type === type)
                    .filter((i) => i.name.toLowerCase().includes(filterText))
                    .sort(
                        (a, b) =>
                            a.name.compare(b.name) *
                            (sort === SortDirection.Descending ? 1 : -1),
                    );

                return result;
            },
            {} as Record<ItemType, CosmereItem[]>,
        );

        // Set up sections
        return await Promise.all(
            (Object.keys(categories) as ItemType[])
                .filter((type) => categories[type].length > 0)
                .map(async (type) => ({
                    id: type,
                    label: CONFIG.COSMERE.items.types[type].labelPlural,
                    items: categories[type],
                    itemData: await this.prepareItemData(categories[type]),
                })),
        );
    }

    protected async prepareTalentsData(
        items: TalentItem[],
        filterText: string,
        sort: SortDirection,
    ) {
        // Get all path items
        const pathItems = this.application.actor.items.filter((item) =>
            item.isPath(),
        );

        // Get paths
        const paths = pathItems
            .map((item) => ({
                label: item.name,
                id: item.system.id,
                modality: undefined as string | undefined,
            }))
            .sort((a, b) => a.label.compare(b.label));

        // Get ancestry item
        const ancestryItem = this.application.actor.items.find((item) =>
            item.isAncestry(),
        );

        // Map talents to paths
        const talentsByPath = items.reduce(
            (result, talent) => {
                if (!talent.system.path) return result;

                const path = paths.find((p) => p.id === talent.system.path);
                if (!path) return result;

                if (!result[path.id]) result[path.id] = [];
                result[path.id].push(talent);

                return result;
            },
            {} as Record<string, TalentItem[]>,
        );

        // Get ancestry talents
        const ancestryTalents = (
            ancestryItem
                ? items.filter(
                      (item) => item.system.ancestry === ancestryItem.system.id,
                  )
                : []
        )
            .filter((item) => item.name.toLowerCase().includes(filterText))
            .sort(
                (a, b) =>
                    a.name.compare(b.name) *
                    (sort === SortDirection.Descending ? 1 : -1),
            );

        // Get remaining talents
        const remainingTalents = items
            .filter(
                (item) =>
                    (!item.system.path || !talentsByPath[item.system.path]) &&
                    (!item.system.ancestry ||
                        item.system.ancestry !== ancestryItem?.id),
            )
            .filter((item) => item.name.toLowerCase().includes(filterText))
            .sort(
                (a, b) =>
                    a.name.compare(b.name) *
                    (sort === SortDirection.Descending ? 1 : -1),
            );

        return await Promise.all([
            ...(ancestryItem && ancestryTalents.length > 0
                ? [
                      {
                          label: ancestryItem.name,
                          id: ancestryItem.system.id,
                          items: ancestryTalents,
                          itemData: await this.prepareItemData(ancestryTalents),
                      },
                  ]
                : []),

            ...paths
                .filter((path) => talentsByPath[path.id]?.length > 0)
                .map(async (path) => {
                    // Get talents
                    const talents = talentsByPath[path.id]
                        .filter((item) =>
                            item.name.toLowerCase().includes(filterText),
                        )
                        .sort(
                            (a, b) =>
                                a.name.compare(b.name) *
                                (sort === SortDirection.Descending ? 1 : -1),
                        );

                    return {
                        ...path,
                        items: talents,
                        itemData: await this.prepareItemData(talents),
                    };
                }),

            ...(remainingTalents.length > 0
                ? [
                      {
                          label: 'COSMERE.Item.Type.Talent.label_plural',
                          id: 'talents',
                          items: remainingTalents,
                          itemData:
                              await this.prepareItemData(remainingTalents),
                      },
                  ]
                : []),
        ]);
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
            AppContextMenu.create(
                this as AppContextMenu.Parent,
                'right',
                [
                    /**
                     * NOTE: This is a TEMPORARY context menu option
                     * until we can handle recharging properly.
                     */
                    {
                        name: 'COSMERE.Item.Activation.Uses.Recharge.Label',
                        icon: 'fa-solid fa-rotate-left',
                        callback: (element) => {
                            const item = AppUtils.getItemFromElement(
                                element,
                                this.application.actor,
                            );
                            if (!item) return;

                            void item.recharge();
                        },
                    },
                    {
                        name: 'GENERIC.Button.Edit',
                        icon: 'fa-solid fa-pen-to-square',
                        callback: (element) => {
                            const item = AppUtils.getItemFromElement(
                                element,
                                this.application.actor,
                            );
                            if (!item) return;

                            void item.sheet?.render(true);
                        },
                    },
                    {
                        name: 'GENERIC.Button.Remove',
                        icon: 'fa-solid fa-trash',
                        callback: (element) => {
                            const item = AppUtils.getItemFromElement(
                                element,
                                this.application.actor,
                            );
                            if (!item) return;

                            // Remove the item
                            void this.application.actor.deleteEmbeddedDocuments(
                                'Item',
                                [item.id],
                            );
                        },
                    },
                ],
                'a[data-action="toggle-actions-controls"]',
            );
        }
    }
}

// Register
ActorActionsListComponent.register('app-actor-actions-list');
