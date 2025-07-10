import { ItemType } from '@system/types/cosmere';
import { ItemRelationship } from '@system/data/item/mixins/relationships';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';
import { CharacterSheet } from '../../character-sheet';

export class CharacterPathsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_PATHS}`;

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

    private static onRemove(this: CharacterPathsComponent, event: Event) {
        const pathId = $(event.currentTarget!)
            .closest('.path[data-id]')
            .data('id') as string;

        // Find the path
        const pathItem = this.application.actor.items.get(pathId);

        // Remove the path
        void pathItem?.delete();
    }

    private static onView(this: CharacterPathsComponent, event: Event) {
        const pathId = $(event.currentTarget!)
            .closest('.path[data-id]')
            .data('id') as string;

        // Find the path
        const pathItem = this.application.actor.items.get(pathId);

        // Open the path sheet
        void pathItem?.sheet?.render(true);
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        // Find all paths
        const pathItems = this.application.actor.items.filter((item) =>
            item.isPath(),
        );

        return Promise.resolve({
            ...context,

            paths: pathItems.map((path) => ({
                ...path,
                id: path.id,
                img: path.img,
                typeLabel: CONFIG.COSMERE.paths.types[path.system.type].label,
                numTalents: path.system.relationships
                    .filter((rel) => rel.type === ItemRelationship.Type.Child)
                    .filter((rel) => rel.itemType === ItemType.Talent).length,
                skills: path.system.linkedSkills
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
                        mod: this.application.actor.system.skills[skillId].mod,
                    })),
                level: this.application.actor.talents.filter(
                    (talent) => talent.pathId === path.id,
                ).length,
            })),
        });
    }
}

// Register
CharacterPathsComponent.register('app-character-paths-list');
