import { ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../../base';

export class CharacterAncestryComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/actors/character/components/ancestry.hbs';

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

    private static onRemove(this: CharacterAncestryComponent) {
        void this.application.actor.items
            .find((item) => item.type === ItemType.Ancestry)
            ?.delete();
    }

    private static onView(this: CharacterAncestryComponent) {
        const ancestryItem = this.application.actor.items.find(
            (item) => item.type === ItemType.Ancestry,
        );
        void ancestryItem?.sheet?.render(true);
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        // Find the ancestry
        const ancestryItem = this.application.actor.items.find(
            (item) => item.type === ItemType.Ancestry,
        );

        return Promise.resolve({
            ...context,

            ...(ancestryItem
                ? {
                      ancestry: {
                          label: ancestryItem.name,
                          img: ancestryItem.img,
                      },
                  }
                : {}),
        });
    }
}

// Register
CharacterAncestryComponent.register('app-character-ancestry');
