import { ConstructorOf } from '@system/types/utils';
import { CosmereItem } from '@system/documents';
import { AppContextMenu } from '@system/applications/utils/context-menu';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SortMode } from './search-bar';

type EffectListType = 'inactive' | 'passive' | 'temporary';

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
    inactive: 'COSMERE.Sheet.Effects.Inactive',
    passive: 'COSMERE.Sheet.Effects.Passive',
    temporary: 'COSMERE.Sheet.Effects.Temporary',
};

export class ActorEffectsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>,
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
        const effect = this.getEffectFromEvent(event);
        if (!effect) return;

        // Toggle active
        void effect.update({
            disabled: !effect.disabled,
        });
    }

    /* --- Context --- */

    public _prepareContext(params: Params, context: RenderContext) {
        // Get effects
        let effects = this.application.actor.applicableEffects
            .filter((effect) => !effect.id.startsWith('cond'))
            .filter((effect) =>
                effect.name.toLowerCase().includes(context.effectsSearch.text),
            );

        if (context.effectsSearch.sort === SortMode.Alphabetic) {
            effects = effects.sort((a, b) => a.name.compare(b.name));
        }

        // Filter effects down to the correct type
        if (params.type === 'inactive') {
            effects = effects.filter((effect) => !effect.active);
        } else if (params.type === 'passive') {
            effects = effects.filter(
                (effect) => effect.active && !effect.isTemporary,
            );
        } else if (params.type === 'temporary') {
            effects = effects.filter(
                (effect) => effect.active && effect.isTemporary,
            );
        }

        // Set context
        return Promise.resolve({
            ...context,
            effectsTitle: TITLE_MAP[params.type],
            effects,
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
                        name: 'GENERIC.Button.Edit',
                        icon: 'fa-solid fa-pen-to-square',
                        callback: (element) => {
                            const effect = this.getEffectFromElement(element);
                            if (!effect) return;

                            void effect.sheet?.render(true);
                        },
                    },
                    {
                        name: 'GENERIC.Button.Remove',
                        icon: 'fa-solid fa-trash',
                        callback: (element) => {
                            const effect = this.getEffectFromElement(element);
                            if (!effect) return;

                            void effect.parent?.deleteEmbeddedDocuments(
                                'ActiveEffect',
                                [effect.id],
                            );
                        },
                    },
                ],
                selectors: ['a[data-action="toggle-effect-controls"]'],
                anchor: 'right',
            });
        }
    }

    /* --- Helpers --- */

    private getEffectFromEvent(event: Event): ActiveEffect | undefined {
        if (!event.target && !event.currentTarget) return;

        return this.getEffectFromElement(
            (event.target ?? event.currentTarget) as HTMLElement,
        );
    }

    private getEffectFromElement(
        element: HTMLElement,
    ): ActiveEffect | undefined {
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
    ): ActiveEffect | undefined {
        if (!parentId)
            return this.application.actor.getEmbeddedDocument(
                'ActiveEffect',
                effectId,
            ) as ActiveEffect | undefined;
        else {
            // Get item
            const item = this.application.actor.getEmbeddedDocument(
                'Item',
                parentId,
            ) as CosmereItem | undefined;
            return item?.getEmbeddedDocument('ActiveEffect', effectId) as
                | ActiveEffect
                | undefined;
        }
    }
}

// Register
ActorEffectsListComponent.register('app-actor-effects-list');
