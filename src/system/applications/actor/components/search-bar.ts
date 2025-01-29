import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export interface SearchBarInputEventDetail {
    text: string;
    sort: SortMode;
}

export type SearchBarInputEvent = CustomEvent<SearchBarInputEventDetail>;

export const enum SortMode {
    Manual = 'manual',
    Alphabetic = 'alphabetic',
}

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    placeholder?: string;
};

export class ActorSearchBarComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>,
    Params
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_SEARCH_BAR}`;

    /**
     * The amount of time to wait after a user's keypress before the name search filter is applied, in milliseconds.
     * @type {number}
     */
    static FILTER_DEBOUNCE_MS = 200;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'actions-clear-filter': this.onClearFilter,
        'actions-filter-by': this.onFilterBy,
        'actions-toggle-sort': this.onToggleSort,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private searchText = '';
    private sortDirection: SortMode = SortMode.Alphabetic;

    /* --- Actions --- */

    public static onClearFilter(this: ActorSearchBarComponent) {
        this.searchText = '';

        void this.render();
        this.triggerChange();
    }

    public static onFilterBy(this: ActorSearchBarComponent) {}

    public static onToggleSort(this: ActorSearchBarComponent) {
        this.sortDirection =
            this.sortDirection === SortMode.Alphabetic
                ? SortMode.Manual
                : SortMode.Alphabetic;

        void this.render();
        this.triggerChange();
    }

    /* --- Life cycle --- */

    public _onAttachListeners(): void {
        const debounceSearch = foundry.utils.debounce(
            this.onSearchInput.bind(this),
            ActorSearchBarComponent.FILTER_DEBOUNCE_MS,
        );
        $(this.element!).find('input').on('input', debounceSearch);
    }

    /* --- Event handlers --- */

    private async onSearchInput(event: Event) {
        if (event.type !== 'input') return;
        event.preventDefault();
        event.stopPropagation();

        this.searchText = (event.target as HTMLInputElement).value;

        await this.render();
        this.triggerChange();

        const search = $(this.element!).find('input')[0];
        search.selectionStart = search.selectionEnd = this.searchText.length;
    }

    private triggerChange() {
        const event = new CustomEvent('search', {
            detail: {
                text: this.searchText.toLocaleLowerCase(game.i18n!.lang),
                sort: this.sortDirection,
            },
        });

        this.element!.dispatchEvent(event);
    }

    /* --- Context --- */

    public _prepareContext(params: Params) {
        return Promise.resolve({
            text: this.searchText,
            sort: this.sortDirection,
            placeholder: params.placeholder,
        });
    }
}

// Register
ActorSearchBarComponent.register('app-actor-search-bar');
