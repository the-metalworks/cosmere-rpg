import {
    CosmereActiveEffect,
    CosmereItem,
    EffectsContainerItem,
} from '@system/documents';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';
import { EffectListType } from '@src/system/types/cosmere';
import { getSystemSetting, SETTINGS } from '@src/system/settings';
import { ActorItemListComponent, AdditionalItemData } from './item-list';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    type: EffectListType;
};

interface RenderContext extends BaseActorSheetRenderContext {
    effectsSearch: {
        text: string;
        sort: SortMode;
    };
}

type EffectItemData = AdditionalItemData & { isEffectsContainer: boolean };

// Constants
const TITLE_MAP: Record<EffectListType, string> = {
    [EffectListType.Inactive]: 'COSMERE.Sheet.Effects.Inactive',
    [EffectListType.Passive]: 'COSMERE.Sheet.Effects.Passive',
    [EffectListType.Temporary]: 'COSMERE.Sheet.Effects.Temporary',
};

export class ActorEffectsListComponent extends ActorItemListComponent {
    static TEMPLATE = `${TEMPLATES.DIRECTORY}${TEMPLATES.ACTOR_BASE_EFFECTS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        ...super.ACTIONS,
        'toggle-action-details': this.onToggleActionDetails,
        'toggle-section-collapsed': this.onToggleSectionCollapsed,
        'toggle-effect-active': this.onToggleEffectActive,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /**
     * Current state of the effects section
     */
    protected state =
        getSystemSetting(SETTINGS.SHEET_EXPAND_SECTIONS_DEFAULT) ?? true;
    protected itemData = {} as Record<string, EffectItemData>;

    /* --- Actions --- */

    public static onToggleEffectActive(
        this: ActorEffectsListComponent,
        event: Event,
    ) {
        const effect = this.getEffectFromEvent(event) as CosmereActiveEffect;
        if (!effect) return;

        // Toggle active
        void effect.update({
            disabled: !effect.disabled,
        });
    }

    public static onToggleSectionCollapsed(
        this: ActorEffectsListComponent,
        event: Event,
    ) {
        event.preventDefault();
        event.stopPropagation();
        // Get item element
        const sectionElement = $(event.target!).closest(
            '.item-list.effect-list',
        );

        // Update the state
        this.state = !this.state;

        // Set classes
        sectionElement.toggleClass('expanded', this.state);
    }

    /* --- Context --- */

    public async _prepareContext(params: Params, context: RenderContext) {
        console.log(params.type);
        const items = Array.from(this.application.actor.items)
            .filter(
                (item) =>
                    item.hasEffectOfType(params.type) ||
                    (params.type === EffectListType.Inactive &&
                        !item.hasEffects &&
                        item.isEffectsContainer() &&
                        item.name.includes(context.effectsSearch.text)),
            )
            .sort((a, b) =>
                a.name.toLocaleLowerCase().compare(b.name.toLocaleLowerCase()),
            );

        // Set context
        return {
            ...context,
            effectsTitle: TITLE_MAP[params.type],
            effects: await this.prepareItems(params, context, items),
            expanded: this.state,
            itemState: this.itemState,
            itemData: this.itemData,
        };
    }

    private async prepareItems(
        params: Params,
        context: RenderContext,
        items: CosmereItem[],
    ) {
        return Promise.all(
            items.map(async (item) => {
                // handle item state & data
                this.itemState[item.id!] = { expanded: false };
                this.itemData[item.id!] = {
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
                    isEffectsContainer: item.isEffectsContainer(),
                };

                // filter effects
                const effects = item
                    .getEffectsOfType(params.type)
                    .filter((effect) =>
                        effect.name.includes(context.effectsSearch.text),
                    )
                    .sort((a, b) =>
                        a.name
                            .toLocaleLowerCase()
                            .compare(b.name.toLocaleLowerCase()),
                    );
                return effects.length === 1 ? effects[0] : [item, effects];
            }),
        );
    }

    /* --- Lifecycle --- */

    public _onInitialize(): void {
        if (this.application.isEditable) {
            // Create context menu
            AppContextMenu.create({
                parent: this as AppContextMenu.Parent,
                items: (element) => {
                    const effect = this.getEffectFromElement(element);
                    if (!effect) return [];
                    const menuItems = [
                        {
                            name: 'GENERIC.Button.Edit',
                            icon: 'fa-solid fa-pen-to-square',
                            callback: () => {
                                void effect.sheet?.render(true);
                            },
                        },
                        {
                            name: 'GENERIC.Button.Remove',
                            icon: 'fa-solid fa-trash',
                            callback: () => {
                                void effect.delete();
                            },
                        },
                    ];
                    if (effect.parent?.name === this.application.actor.name) {
                        return menuItems;
                    }
                    return [
                        {
                            name: 'GENERIC.Button.Source',
                            icon: 'fa-solid fa-angles-up',
                            callback: () => {
                                void effect.parent?.sheet?.render(true);
                            },
                        },
                        ...menuItems,
                    ];
                },
                selectors: ['a[data-action="toggle-effect-controls"]'],
                anchor: 'right',
            });
        }
    }

    /* --- Helpers --- */

    private getEffectFromEvent(
        event: Event,
    ): CosmereActiveEffect | EffectsContainerItem | null {
        if (!event.target && !event.currentTarget) return null;

        return this.getEffectFromElement(
            (event.target ?? event.currentTarget) as HTMLElement,
        );
    }

    private getEffectFromElement(
        element: HTMLElement,
    ): CosmereActiveEffect | EffectsContainerItem | null {
        const effectElement = $(element).closest('.effect[data-item-id]');

        // Get the uuid
        const uuid = effectElement.data('uuid') as string;

        const effect = fromUuidSync(uuid) as
            | CosmereActiveEffect
            | EffectsContainerItem
            | null;
        return effect;
    }
}

// Register
ActorEffectsListComponent.register('app-actor-effects-list');
