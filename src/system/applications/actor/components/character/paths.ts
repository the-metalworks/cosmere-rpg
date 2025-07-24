import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../../base';
import { CharacterSheet } from '../../character-sheet';

export class CharacterPathsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<CharacterSheet>
> {
    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/actors/character/components/paths.hbs';

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
                level: this.application.actor.system.level.paths[
                    path.system.id
                ],
            })),
        });
    }
}

// Register
CharacterPathsComponent.register('app-character-paths-list');
