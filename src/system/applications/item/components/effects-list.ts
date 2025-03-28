import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

type EffectListType = 'inactive' | 'passive' | 'temporary';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    type: EffectListType;
};

// Constants
const TITLE_MAP: Record<EffectListType, string> = {
    inactive: 'COSMERE.Sheet.Effects.Inactive',
    passive: 'COSMERE.Sheet.Effects.Passive',
    temporary: 'COSMERE.Sheet.Effects.Temporary',
};

export class ItemEffectsListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_EFFECTS_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'create-effect': this.onCreateEffect,
        'toggle-effect-active': this.onToggleEffectActive,
        'edit-effect': this.onEditEffect,
        'delete-effect': this.onDeleteEffect,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    public static async onCreateEffect(this: ItemEffectsListComponent) {
        // Create effect
        const effect = (await ActiveEffect.create(
            {
                name: this.application.item.name,
                img: this.application.item.img,
                disabled: this.params!.type === 'inactive',
                duration:
                    this.params!.type === 'temporary'
                        ? { rounds: 1 }
                        : undefined,
            },
            { parent: this.application.item },
        )) as ActiveEffect;

        // Show effect sheet
        await effect.sheet!.render(true);
    }

    public static async onToggleEffectActive(
        this: ItemEffectsListComponent,
        event: Event,
    ) {
        const effect = this.getEffectFromEvent(event);
        if (!effect) return;

        // Toggle active
        await effect.update({
            disabled: !effect.disabled,
        });
    }

    public static onEditEffect(this: ItemEffectsListComponent, event: Event) {
        const effect = this.getEffectFromEvent(event);
        if (!effect) return;

        // Show effect sheet
        void effect.sheet!.render(true);
    }

    public static async onDeleteEffect(
        this: ItemEffectsListComponent,
        event: Event,
    ) {
        const effect = this.getEffectFromEvent(event);
        if (!effect) return;

        // Delete effect
        await effect.delete();
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: BaseItemSheetRenderContext,
    ) {
        const effects = this.application.item.effects.filter((effect) => {
            switch (params.type) {
                case 'inactive':
                    return !effect.active;
                case 'passive':
                    return effect.active && !effect.isTemporary;
                case 'temporary':
                    return effect.active && effect.isTemporary;
            }
        });

        return Promise.resolve({
            ...context,
            effects,
            title: TITLE_MAP[params.type],
        });
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

        // Get the effect
        return this.application.item.effects.get(id);
    }
}

// Register the component
ItemEffectsListComponent.register('app-item-effects-list');
