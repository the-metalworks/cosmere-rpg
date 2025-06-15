import { CultureItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';
import { CharacterSheet } from '../../character-sheet';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    culture: CultureItem;
};

export class CharacterCultureComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_CULTURE}`;

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
        void this.params!.culture.delete();
    }

    private static onView(this: CharacterCultureComponent) {
        void this.params!.culture.sheet?.render(true);
    }

    /* --- Accessors --- */

    public get item(): CultureItem {
        return this.params!.culture;
    }

    public get culture(): CultureItem {
        return this.params!.culture;
    }

    /* --- Context --- */

    public _prepareContext(
        params: Params,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            culture: {
                label: this.culture.name,
                img: this.culture.img,
            },
            skills: this.culture.hasLinkedSkills()
                ? this.culture.system.linkedSkills
                      .filter(
                          (skillId) =>
                              this.application.actor.system.skills[skillId]
                                  .unlocked === true,
                      )
                      .map((skillId) => ({
                          id: skillId,
                          label: CONFIG.COSMERE.skills[skillId].label,
                          attribute: CONFIG.COSMERE.skills[skillId].attribute,
                          attributeLabel:
                              CONFIG.COSMERE.attributes[
                                  CONFIG.COSMERE.skills[skillId].attribute
                              ].label,
                          rank: this.application.actor.system.skills[skillId]
                              .rank,
                          mod: this.application.actor.system.skills[skillId]
                              .mod,
                      }))
                : [],
        });
    }
}

// Register the component
CharacterCultureComponent.register('app-character-culture');
