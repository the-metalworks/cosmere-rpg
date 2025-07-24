import { CultureItem } from '@system/documents/item';

import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';
import { CharacterSheet } from '../../character-sheet';

export class CharacterCultureComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/actors/character/components/culture.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        remove: this.onRemove,
        view: this.onView,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static onRemove(this: CharacterCultureComponent) {
        void this.application.actor.items
            .find((item) => item.isCulture())
            ?.delete();
    }

    private static onView(this: CharacterCultureComponent) {
        const cultureItem = this.application.actor.items.find((item) =>
            item.isCulture(),
        );
        void cultureItem?.sheet?.render(true);
    }

    /* --- Context --- */

    public _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        // Find the culture
        const cultureItem = this.application.actor.items.find((item) =>
            item.isCulture(),
        ) as CultureItem | undefined;

        return Promise.resolve({
            ...context,

            ...(cultureItem
                ? {
                      culture: {
                          label: cultureItem.name,
                          img: cultureItem.img,
                      },
                  }
                : {}),
        });
    }
}

// Register the component
CharacterCultureComponent.register('app-character-culture');
