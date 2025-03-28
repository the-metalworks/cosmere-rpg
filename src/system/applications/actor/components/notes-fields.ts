import { ConstructorOf } from '@src/system/types/utils';
import { HandlebarsApplicationComponent } from '../../component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class ActorNotesFieldsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_NOTES_FIELDS}`;

    public _prepareContext(
        params: unknown,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({ ...context });
    }
}

// Register the comopnent
ActorNotesFieldsComponent.register('app-actor-notes-fields');
