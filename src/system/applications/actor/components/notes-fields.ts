import { AnyObject, ConstructorOf } from '@system/types/utils';
import { HandlebarsApplicationComponent } from '../../component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

type NotesSectionType = 'biography' | 'appearance' | 'notes';

interface NotesSection {
    /**
     * The id of the section
     */
    id: string;

    /**
     * Nicely formatted label for the section
     */
    label: string;

    /**
     * Nicely formatted edit label for the section
     */
    editLabel: string;

    /**
     * label/id for the target html field
     */
    htmlField: string;
}

interface NotesSectionState {
    expanded?: boolean;
}

export class ActorNotesFieldsComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `${TEMPLATES.DIRECTORY}${TEMPLATES.ACTOR_BASE_NOTES_FIELDS}`;

    protected sectionState: Record<string, NotesSectionState> = {};
    private sectionType: string[] = ['biography', 'appearance', 'notes'];
    private sections: NotesSection[] = [];

    public async _prepareContext(
        params: unknown,
        context: BaseActorSheetRenderContext,
    ) {
        this.sectionType.forEach((type) => {
            if (!(type in this.sectionState)) {
                this.sectionState[type] = {
                    expanded: false,
                };
            }
        });

        this.sections = [
            this.prepareSection('appearance'),
            this.prepareSection('biography'),
            this.prepareSection('notes'),
        ];

        return Promise.resolve({
            ...context,
            sections: this.sections,
            sectionState: this.sectionState,
        });
    }

    protected prepareSection(type: NotesSectionType): NotesSection {
        return {
            id: type,
            label: game.i18n.localize(
                `COSMERE.Actor.Sheet.Details.${type.capitalize()}.Label`,
            ),
            editLabel: game.i18n.localize(
                `COSMERE.Actor.Sheet.Details.${type.capitalize()}.Edit`,
            ),
            htmlField: `${type}Html`,
        };
    }

    protected _onRender(params: AnyObject): void {
        super._onRender(params);

        $(this.element!)
            .find('.collapsible .header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        // Get element from event
        const target = $(event.target).closest('.html-field');

        // Get the section id
        const sectionId = target.data('field-type') as string;

        // Update the section state
        this.sectionState[sectionId].expanded =
            !this.sectionState[sectionId].expanded;

        // Set classes
        target.toggleClass('expanded', this.sectionState[sectionId].expanded);
    }
}

// Register the comopnent
ActorNotesFieldsComponent.register('app-actor-notes-fields');
