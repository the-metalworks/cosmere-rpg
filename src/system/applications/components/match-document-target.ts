import type { InterfaceToObject } from '@system/types/utils';

import { matchDocuments } from '@system/utils/match-document';

// Dialogs
import { MatchDocumentConfigDialog } from '../dialogs/match-document-config';

// Data
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';

// Utils
import DataModelUtils from '@system/utils/data-model';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class MatchDocumentTargetComponent extends HandlebarsApplicationComponent<
    foundry.applications.api.ApplicationV2.AnyConstructor,
    InterfaceToObject<MatchDocumentTargetComponent.Params>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMPONENT_MATCH_DOCUMENT_TARGET}`;
    static readonly FORM_ASSOCIATED = true;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        configure: this.onConfigure,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private _value?: MatchDocumentField.InitializedType;
    private _name?: string;

    /* --- Accessors --- */

    public get value() {
        return this._value!;
    }

    public set value(value: MatchDocumentField.InitializedType) {
        this._value = value;

        this.element!.value = value;
        this.element?.dispatchEvent(new Event('change', { bubbles: true }));
    }

    public get name() {
        return this._name;
    }

    public set name(value: string | undefined) {
        this._name = value;

        this.element!.name = this._name ?? '';
        this.element!.setAttribute('name', this._name ?? '');
    }

    public get element():
        | (HTMLElement & {
              name?: string;
              value: MatchDocumentField.InitializedType;
          })
        | undefined {
        return super.element as HTMLElement & {
            name?: string;
            value: MatchDocumentField.InitializedType;
        };
    }

    /* --- Actions --- */

    private static async onConfigure(this: MatchDocumentTargetComponent) {
        if (!this.params?.value) return;
        if (!this.params.name) return;

        const data = await MatchDocumentConfigDialog.show(this.params.value, {
            relativeTo: this.params.relativeTo,
            type: this.params.type,
        });
        if (!data) return;

        this.value.updateSource(data?.toObject());

        // Re-assign to trigger change event
        this.value = this._value!;
    }

    /* --- Lifecycle --- */

    protected override _onInitialize(
        params: MatchDocumentTargetComponent.Params,
    ) {
        super._onInitialize(params);

        this._value = params.value;
        this._name = params.name;
    }

    protected override _onRender(params: MatchDocumentTargetComponent.Params) {
        super._onRender(params);

        this.element!.value = this.value;

        if (this._name) this.name = this._name;
    }

    /* --- Context --- */

    public async _prepareContext(params: MatchDocumentTargetComponent.Params) {
        let resolvedDocument: foundry.abstract.Document.Any | null = null;

        try {
            const matches = await matchDocuments({
                ...params.value,
                relativeTo: params.relativeTo,
            });

            if (matches.length === 1) resolvedDocument = matches[0];
        } catch (err) {
            console.warn(
                'Error matching document for MatchDocumentTargetComponent:',
                err,
            );

            // Ignore errors, resolvedDocument will just be null and the component can handle that case
        }

        const lastStep = params.value.steps[params.value.steps.length - 1];

        const resolvedReference =
            typeof lastStep.reference === 'string'
                ? await fromUuid(lastStep.reference)
                : lastStep.reference;

        return Promise.resolve({
            ...params,
            resolvedDocument,
            resolvedReference,
            editable: params.editable !== false && params.name,
        });
    }
}

export namespace MatchDocumentTargetComponent {
    export interface Params {
        value: MatchDocumentField.InitializedType;
        relativeTo: foundry.abstract.Document.Any;
        type?: foundry.abstract.Document.Type;
        name?: string;
        editable?: boolean;
    }
}

// Register the component
MatchDocumentTargetComponent.register('app-match-document-target');
