import { CosmereItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';
import { CharacterSheet } from '../../character-sheet';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    item: CosmereItem;
};

export class CharacterSkillLinkedItemComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>,
    Params
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_SKILL_LINKED_ITEM}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        view: this.onView,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static onView(
        this: CharacterSkillLinkedItemComponent,
        event: Event,
    ) {
        void this.item.sheet?.render(true);
    }

    /* --- Accessors --- */

    public get item(): CosmereItem {
        return this.params!.item;
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,
            item: this.item,
            id: this.item.id,
            img: this.item.img,
            typeLabel: this.item.isTyped() ? this.item.system.typeLabel : null,
            skills: this.item.hasLinkedSkills()
                ? this.item.system.linkedSkills
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
CharacterSkillLinkedItemComponent.register('app-character-skill-linked-item');
