import { ConstructorOf } from '@system/types/utils';
import {
    CosmereActiveEffect,
    CosmereItem,
    EffectsContainerItem,
} from '@system/documents';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';
import { EffectListType } from '@src/system/types/cosmere';

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

// Constants
const TITLE_MAP: Record<EffectListType, string> = {
    [EffectListType.Inactive]: 'COSMERE.Sheet.Effects.Inactive',
    [EffectListType.Passive]: 'COSMERE.Sheet.Effects.Passive',
    [EffectListType.Temporary]: 'COSMERE.Sheet.Effects.Temporary',
};

export class ActorEffectsListComponent extends HandlebarsApplicationComponent<
    // typeof BaseActorSheet,
    // TODO: Resolve typing issues
    // NOTE: Use any as workaround for foundry-vtt-types issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_EFFECTS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-effect-active': this.onToggleEffectActive,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

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

    /* --- Context --- */

    public _prepareContext(params: Params, context: RenderContext) {
        const items = Array.from(this.application.actor.items)
            .filter((item) => item.hasEffects || item.isEffectsContainer())
            .sort((a, b) => a.name.compare(b.name));

        const effects = items.map((item) => {
            let effects: CosmereActiveEffect[] = [];
            switch (params.type) {
                case EffectListType.Inactive: {
                    effects = item.inactiveEffects;
                    break;
                }
                case EffectListType.Passive: {
                    effects = item.passiveEffects;
                    break;
                }
                case EffectListType.Temporary: {
                    effects = item.temporaryEffects;
                    break;
                }
            }
            effects = effects
                .filter((effect) =>
                    effect.name.includes(context.effectsSearch.text),
                )
                .sort((a, b) => a.name.compare(b.name));
            return effects.length === 1 ? effects[0] : [item, effects];
        });

        // Set context
        return Promise.resolve({
            ...context,
            effectsTitle: TITLE_MAP[params.type],
            effects: effects,
        });
    }

    /* --- Lifecycle --- */

    public _onInitialize(): void {
        if (this.application.isEditable) {
            // Create context menu
            AppContextMenu.create({
                parent: this as AppContextMenu.Parent,
                items: [
                    {
                        name: 'GENERIC.Button.Source',
                        icon: 'fa-solid fa-angles-up',
                        callback: (element) => {
                            const effect = this.getEffectFromElement(element);
                            if (!effect) return;

                            void effect.parent?.sheet?.render(true);
                        },
                    },
                    {
                        name: 'GENERIC.Button.Edit',
                        icon: 'fa-solid fa-pen-to-square',
                        callback: (element: HTMLElement) => {
                            const effect = this.getEffectFromElement(element);
                            if (!effect) return;

                            void effect.sheet?.render(true);
                        },
                    },
                    {
                        name: 'GENERIC.Button.Remove',
                        icon: 'fa-solid fa-trash',
                        callback: (element: HTMLElement) => {
                            const effect = this.getEffectFromElement(element);
                            if (!effect) return;

                            void effect.delete();
                        },
                    },
                ],
                selectors: ['a[data-action="toggle-effect-controls"]'],
                anchor: 'right',
            });
        }
    }

    /* --- Helpers --- */

    private getEffectFromEvent(
        event: Event,
    ): CosmereActiveEffect | EffectsContainerItem | undefined {
        if (!event.target && !event.currentTarget) return;

        return this.getEffectFromElement(
            (event.target ?? event.currentTarget) as HTMLElement,
        );
    }

    private getEffectFromElement(
        element: HTMLElement,
    ): CosmereActiveEffect | EffectsContainerItem | undefined {
        const effectElement = $(element).closest('.effect[data-id]');

        // Get the id
        const id = effectElement.data('id') as string;

        // Get the parent id (if it exists)
        const parentId = effectElement.data('parent-id') as string | undefined;

        // Get the effect
        return this.getEffect(id, parentId);
    }

    private getEffect(
        effectId: string,
        parentId?: string,
    ): CosmereActiveEffect | EffectsContainerItem | undefined {
        if (!parentId)
            return (
                this.application.actor.getEmbeddedDocument(
                    'ActiveEffect',
                    effectId,
                    {},
                ) ??
                (this.application.actor.getEmbeddedDocument(
                    'Item',
                    effectId,
                    {},
                ) as EffectsContainerItem)
            );
        else {
            // Get item
            const item = this.application.actor.getEmbeddedDocument(
                'Item',
                parentId,
                {},
            );
            return item?.getEmbeddedDocument('ActiveEffect', effectId, {});
        }
    }
}

// Register
ActorEffectsListComponent.register('app-actor-effects-list');
