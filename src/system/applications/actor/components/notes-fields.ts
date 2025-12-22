import { AnyObject, ConstructorOf } from '@system/types/utils';
import { HandlebarsApplicationComponent } from '../../component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class ActorNotesFieldsComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_NOTES_FIELDS}`;

    public _prepareContext(
        params: unknown,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({ ...context });
    }

    protected _onRender(params: AnyObject): void {
        super._onRender(params);

        $(this.element!)
            .find('.collapsible .header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    /* --- Event handlers --- */

    private onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
    }
}

// Register the comopnent
ActorNotesFieldsComponent.register('app-actor-notes-fields');
