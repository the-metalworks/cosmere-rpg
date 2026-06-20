import type { InterfaceToObject } from '@system/types/utils';

// Data
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Utils
import { matchDocuments } from '@system/utils/match-document';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class MatchDocumentInputsComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    InterfaceToObject<MatchDocumentInputsComponent.Params>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MATCH_DOCUMENT_STEP}`;

    /* --- Context --- */

    public async _prepareContext(params: MatchDocumentInputsComponent.Params) {
        let resolvesTo: foundry.abstract.Document.Any | null = null;

        if (params.relativeTo) {
            const matches = await matchDocuments({
                relativeTo: params.relativeTo,
                ...params.value,
            });

            if (matches.length > 0) resolvesTo = matches[0];
        }

        return {
            ...params,
            resolvesTo,
            name: params.name ?? '',
        };
    }
}

export namespace MatchDocumentInputsComponent {
    export interface Params {
        value: MatchDocumentField.Step.InitializedType;
        name?: string;
        editable?: boolean;
        relativeTo?: foundry.abstract.Document.Any;
    }
}

// Register the component
MatchDocumentInputsComponent.register('app-match-document-step');
