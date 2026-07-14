import {
    ActionType,
    ItemType,
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';
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
import { BaseActorSheetRenderContext } from '../../base';
import { SortMode } from '../search-bar';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import {
    ActorItemListComponent,
    AdditionalItemData,
    ItemListSectionData,
} from '../item-list';

export interface ActorTalentsListComponentRenderContext
    extends BaseActorSheetRenderContext {
    talentsSearch?: {
        text: string;
        sort: SortMode;
    };
}

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
                    label: game.i18n.localize(config.plural),
                    itemTypeLabel: game.i18n.localize(config.label),
                    default: false,
                    filter: (item: CosmereItem) =>
                        item.isPower() && item.system.type === type,
                    new: (parent: CosmereActor) =>
                        CosmereItem.create(
                            {
                                type: ItemType.Power,
                                name: game.i18n.format(
                                    'COSMERE.Item.Type.Power.New',
                                    {
                                        type: game.i18n.localize(config.label),
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
                                            value: {
                                                actual: 1,
                                            },
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
                label: game.i18n.format(
                    'COSMERE.Actor.Sheet.Talents.BaseSectionName',
                    {
                        type: path.name,
                    },
                ),
                itemTypeLabel: `${path.name} ${game.i18n?.localize('COSMERE.Item.Type.Talent.label')}`,
                default: true,
                filter: (item: CosmereItem) =>
                    item.hasRelationships() &&
                    item.isRelatedTo(path, ItemRelationship.Type.Parent),
                new: (parent: CosmereActor) =>
                    CosmereItem.create(
                        {
                            type: ItemType.Talent,
                            name: game.i18n.localize(
                                'COSMERE.Item.Type.Talent.New',
                            ),
                            system: {
                                path: path.system.id,
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
                    label: game.i18n.format(
                        'COSMERE.Actor.Sheet.Talents.BaseSectionName',
                        {
                            type: ancestry.name,
                        },
                    ),
                    itemTypeLabel: `${ancestry.name} ${game.i18n?.localize('COSMERE.Item.Type.Talent.label')}`,
                    default: false,
                    filter: (item: CosmereItem) =>
                        item.hasRelationships() &&
                        item.isRelatedTo(
                            ancestry,
                            ItemRelationship.Type.Parent,
                        ),
                    new: (parent: CosmereActor) =>
                        CosmereItem.create(
                            {
                                type: ItemType.Action,
                                name: game.i18n.localize(
                                    'COSMERE.Item.Type.Talent.New',
                                ),
                                system: {
                                    ancestry: ancestry.system.id,
                                },
                            },
                            { parent },
                        ) as Promise<CosmereItem>,
                },
            ];
        },
    };

const MISC_SECTION: ItemListSection = {
    id: 'misc-talents',
    label: 'COSMERE.Actor.Sheet.Talents.MiscSectionName',
    default: false,
    filter: () => false, // Filter function is not used for this section
};

export class ActorTalentsListComponent extends ActorItemListComponent {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_TALENTS_LIST}`;

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
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Context --- */

    public async _prepareContext(
        params: unknown,
        context: ActorTalentsListComponentRenderContext,
    ) {
        // Get all talent items
        const talentItems = this.application.actor.items.filter((item) =>
            item.isTalent() || item.isPower(),
        );

        // Ensure all items have an expand state record
        talentItems.forEach((item) => {
            if (!(item.id! in this.itemState)) {
                this.itemState[item.id!] = {
                    expanded: false,
                };
            }
        });

        const searchText = context.talentsSearch?.text ?? '';
        const sortMode = context.talentsSearch?.sort ?? SortMode.Alphabetic;

        // Prepare sections
        this.sections = this.prepareSections();

        // Set section expanded defaults
        this.setSectionExpandedDefaults();

        // Prepare sections data
        const sectionsData = await this.prepareSectionsData(
            this.sections,
            talentItems,
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
            sectionState: this.sectionState,
            itemState: this.itemState,
        };
    }

    protected prepareSections() {
        return [
            ...Object.values(
                CONFIG.COSMERE.sheet.actor.components.talents.sections.dynamic,
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
                    result['misc-talents'] ??= [];
                    result['misc-talents'].push(item);
                } else {
                    if (!result[section.id]) result[section.id] = [];
                    result[section.id].push(item);
                }

                return result;
            },
            {} as Record<string, CosmereItem[]>,
        );

        // Prepare "Is section empty" data
        this.sections.forEach((section) => {
            this.sectionState[section.id].hasItems =
                itemsBySectionId[section.id] &&
                itemsBySectionId[section.id].length > 0;
        });

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
                        : game.i18n.format(
                              'COSMERE.Actor.Sheet.Talents.NewItem',
                              {
                                  type: game.i18n.localize(
                                      section.itemTypeLabel ??
                                          'COSMERE.Item.Type.Talent.label',
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
                [item.id!]: {
                    ...(item.hasDescription() && item.system.description?.value
                        ? {
                              descriptionHTML:
                                  await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                                      item.system.description.value,
                                      {
                                          relativeTo: (item as CosmereItem)
                                              .system
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

// Register component
ActorTalentsListComponent.register('app-character-talents-list');

export function configure() {
    // Register dynamic sections
    Object.values(DYNAMIC_SECTIONS).forEach((gen) => {
        cosmereRPG.api.registerTalentListDynamicSectionGenerator({
            source: SYSTEM_ID,
            id: gen.name,
            generator: gen,
        });
    });
}
