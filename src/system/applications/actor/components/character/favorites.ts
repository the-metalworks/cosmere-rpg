import { CosmereActor, CosmereItem } from '@system/documents';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

// Utils
import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { CharacterSheet } from '../../character-sheet';
import { BaseActorSheetRenderContext } from '../../base';

export class CharacterFavoritesComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent,
)<ConstructorOf<CharacterSheet>> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_FAVORITES}`;

    static DRAG_DROP = [
        {
            dropSelector: '*',
        },
    ];

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'use-item': this.onUseItem,
        'remove-favorite': this.onRemoveFavorite,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    public static onUseItem(this: CharacterFavoritesComponent, event: Event) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;

        // Use the item
        void this.application.actor.useItem(item);
    }

    public static onRemoveFavorite(
        this: CharacterFavoritesComponent,
        event: Event,
    ) {
        // Get item
        const item = AppUtils.getItemFromEvent(event, this.application.actor);
        if (!item) return;

        // Remove favorite
        void item.clearFavorite();
    }

    /* --- Drag drop --- */

    protected override _canDragDrop() {
        return this.application.isEditable;
    }

    protected override _onDragOver(event: DragEvent) {
        if (!event.dataTransfer?.types.includes('document/item')) return;

        // Clean up
        $(this.element!).find('.drop-area').removeClass('dropping');
        $(this.element!).find('.drop-indicator').remove();

        if ($(event.target!).closest('.drop-area').length) {
            $(event.target!).closest('.drop-area').addClass('dropping');
        } else if ($(event.target!).closest('.favorite.item').length) {
            const el = $(event.target!)
                .closest('.favorite.item')
                .get(0) as HTMLElement;

            // Get bounding rect
            const bounds = el.getBoundingClientRect();

            if (event.clientY < bounds.top + bounds.height / 2) {
                $(el).before(`<li class="drop-indicator"></li>`);
            } else {
                $(el).after(`<li class="drop-indicator"></li>`);
            }
        }
    }

    protected override async _onDrop(event: DragEvent) {
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };

        // Ensure document type can be embedded on actor
        if (!(data.type in CosmereActor.metadata.embedded)) return;

        // Get the document
        const document = fromUuidSync(data.uuid);
        if (!document) return;

        if (document.parent === this.application.actor) {
            // Document already on this actor
            if (data.type !== 'Item') return;

            const item = document as CosmereItem;

            if (
                $(event.target!).closest('.drop-area').length &&
                !item.isFavorite
            ) {
                // Mark item as favorited
                void item.markFavorite(
                    this.application.actor.favorites.length, // Insert at the end
                );
            } else if ($(event.target!).closest('.favorite.item').length) {
                const el = $(event.target!)
                    .closest('.favorite.item')
                    .get(0) as HTMLElement;

                // Get the index
                let index = $(event.target!)
                    .closest('app-character-favorites')
                    .find('.favorite.item')
                    .toArray()
                    .indexOf(el);

                // Get bounding rect
                const bounds = el.getBoundingClientRect();

                // If item is dropped below the current element, move index over by 1
                if (event.clientY > bounds.top + bounds.height / 2) {
                    index++;
                }

                await Promise.all([
                    // Increase index of all subsequent favorites
                    ...this.application.actor.favorites
                        .slice(index)
                        .map((item, i) =>
                            item.markFavorite(index + i + 1, false),
                        ),

                    // Mark as favorite
                    item.markFavorite(index, false),
                ]);

                // Normalize
                this.application.actor.favorites.forEach(
                    (item, i) => void item.markFavorite(i, false),
                );

                // Render
                void this.render();
            }

            // Clean up
            $(this.element!)
                .find('app-character-favorites .drop-area')
                .removeClass('dropping');
            $(this.element!)
                .find('app-character-favorites .drop-indicator')
                .remove();
        }
    }

    /* --- Context --- */

    public _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            favorites: this.application.actor.favorites,
        });
    }
}

// Register
CharacterFavoritesComponent.register('app-character-favorites');
