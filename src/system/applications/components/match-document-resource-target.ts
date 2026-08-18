import type { InterfaceToObject } from '@system/types/utils';

import { matchDocuments } from '@system/utils/match-document';

// Dialogs
import { MatchDocumentConfigDialog } from '../dialogs/match-document-config';

// Data
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { MatchDocumentTargetComponent } from './match-document-target';

// Utils
import DataModelUtils from '@system/utils/data-model';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import { ItemResource } from '@src/system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

export class MatchDocumentResourceTargetComponent extends MatchDocumentTargetComponent {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MATCH_DOCUMENT_RESOURCE_TARGET}`;
    static readonly FORM_ASSOCIATED = true;

    /* --- Context --- */

    public async _prepareContext(
        params: MatchDocumentResourceTargetComponent.Params,
    ) {
        const matchDocumentContext = await super._prepareContext(params);
        const resolvedDocument = matchDocumentContext.resolvedDocument;
        const hasResource =
            resolvedDocument &&
            resolvedDocument instanceof CosmereItem &&
            resolvedDocument.hasResources() &&
            resolvedDocument.getResource(params.resourceId);

        return Promise.resolve({
            ...matchDocumentContext,
            hasResource,
        });
    }
}

export namespace MatchDocumentResourceTargetComponent {
    export interface Params extends MatchDocumentTargetComponent.Params {
        resourceId: ItemResource;
    }
}

// Register the component
MatchDocumentResourceTargetComponent.register(
    'app-match-document-resource-target',
);
