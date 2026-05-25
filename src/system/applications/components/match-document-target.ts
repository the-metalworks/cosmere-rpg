import type { InterfaceToObject } from '@system/types/utils';

import { matchDocuments } from '@system/utils/match-document';

// Data
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class MatchDocumentTargetComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    InterfaceToObject<MatchDocumentTargetComponent.Params>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MATCH_DOCUMENT_TARGET}`;

    /* --- Context --- */

    public async _prepareContext(params: MatchDocumentTargetComponent.Params) {
        let resolvedDocument: foundry.abstract.Document.Any | null = null;

        if (!params.match.matchAll) {
            try {
                const matches = await matchDocuments({
                    ...params.match,
                    relativeTo: params.relativeTo,
                });

                if (matches.length > 0) resolvedDocument = matches[0];
            } catch (err) {
                console.warn(
                    'Error matching document for MatchDocumentTargetComponent:',
                    err,
                );

                // Ignore errors, resolvedDocument will just be null and the component can handle that case
            }
        }

        const resolvedReference =
            typeof params.match.reference === 'string'
                ? await fromUuid(params.match.reference)
                : params.match.reference;

        return Promise.resolve({
            ...params,
            resolvedDocument,
            resolvedReference,
        });
    }
}

export namespace MatchDocumentTargetComponent {
    export interface Params {
        match: MatchDocumentField.InitializedType;
        relativeTo: foundry.abstract.Document.Any;
    }
}

// Register the component
MatchDocumentTargetComponent.register('app-match-document-target');
