import type { InterfaceToObject } from '@system/types/utils';

// Data
import { MatchDocumentDataModel } from '@system/data/fields/match-document-field';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class MatchDocumentInputsComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    InterfaceToObject<MatchDocumentInputsComponent.Params>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MATCH_DOCUMENT_INPUTS}`;

    /* --- Context --- */

    public _prepareContext(params: MatchDocumentInputsComponent.Params) {
        return Promise.resolve({
            ...params,
            name: params.name ?? '',
            editable: params.editable ?? true,
        });
    }
}

export namespace MatchDocumentInputsComponent {
    export interface Params {
        data: MatchDocumentDataModel;
        name?: string;
        editable?: boolean;
    }
}

// Register the component
MatchDocumentInputsComponent.register('app-match-document-inputs');
