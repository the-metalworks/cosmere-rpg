import { ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';

// Documents
import { AncestryItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../../base';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class CharacterAncestryComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_ANCESTRY}`;

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
        void this.ancestry?.delete();
    }

    private static onView(this: CharacterAncestryComponent) {
        void this.ancestry?.sheet?.render(true);
    }

    /* --- Accessors --- */

    public get ancestry(): AncestryItem | undefined {
        return this.application.actor.ancestry;
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        const hasAncestry = !!this.ancestry;

        return Promise.resolve({
            ...context,

            hasAncestry,

            ...(hasAncestry
                ? {
                      ancestry: {
                          label: this.ancestry.name,
                          img: this.ancestry.img,
                          skills: this.ancestry.system.linkedSkills
                              .filter(
                                  (skillId) =>
                                      this.application.actor.system.skills[
                                          skillId
                                      ].unlocked === true,
                              )
                              .map((skillId) => ({
                                  id: skillId,
                                  label: CONFIG.COSMERE.skills[skillId].label,
                                  attribute:
                                      CONFIG.COSMERE.skills[skillId].attribute,
                                  attributeLabel:
                                      CONFIG.COSMERE.attributes[
                                          CONFIG.COSMERE.skills[skillId]
                                              .attribute
                                      ].label,
                                  rank: this.application.actor.system.skills[
                                      skillId
                                  ].rank,
                                  mod: this.application.actor.system.skills[
                                      skillId
                                  ].mod,
                              })),
                      },
                  }
                : {}),
        });
    }
}

// Register
CharacterAncestryComponent.register('app-character-ancestry');
