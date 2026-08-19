import {
    ActivationType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';

import {
    DocumentTarget,
    ItemTarget,
    MatchBy,
    ItemOnlyTarget,
} from '@system/utils/match-document';

// Documents
import { ActionItem } from '@system/documents/item';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../../base';

// Dialogs
import { EditResourceConsumptionDialog } from '../../dialogs/edit-resource-consumption';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

export class ResourceConsumptionListComponent extends HandlebarsApplicationComponent<
    //@ts-expect-error Workaround for foundry-vtt-types issues
    typeof BaseItemSheet,
    ResourceConsumptionListComponent.Params
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_RESOURCE_CONSUMPTION_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'add-consumption': this._onAddResource,
        'edit-consumption': this._onEditConsumption,
        'delete-consumption': this._onDeleteConsumption,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async _onAddResource(
        this: ResourceConsumptionListComponent,
    ) {
        // Get the activation data
        const { activation } = this.params!.item.system;

        await this.application.item.update({
            system: {
                activation: {
                    consumption: [
                        ...activation!.consumption.map((c) => c.toObject()),
                        {
                            type: ItemConsumeType.Resource,
                            value: {
                                min: 1,
                                max: 1,
                                actual: 1,
                            },
                            resource: Resource.Focus,
                            matchDocument: {
                                steps: [
                                    {
                                        target: DocumentTarget.Ancestor,
                                        documentType: 'Actor',
                                        matchBy: MatchBy.DocumentType,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        });

        void EditResourceConsumptionDialog.show(
            this.params!.item,
            this.params!.item.system.activation!.consumption.length - 1,
        );
    }

    private static _onEditConsumption(
        this: ResourceConsumptionListComponent,
        event: Event,
    ) {
        if (!(event.target instanceof HTMLElement)) return;

        const index = event.target
            .closest('[data-index]')
            ?.getAttribute('data-index');
        if (!index) return;

        const consumptionIndex = parseInt(index);
        const consumption =
            this.params!.item.system.activation!.consumption[consumptionIndex];
        if (!consumption) return;

        void EditResourceConsumptionDialog.show(
            this.params!.item,
            consumptionIndex,
        );
    }

    private static _onDeleteConsumption(
        this: ResourceConsumptionListComponent,
        event: Event,
    ) {
        if (!(event.target instanceof HTMLElement)) return;

        const index = event.target
            .closest('[data-index]')
            ?.getAttribute('data-index');
        if (!index) return;

        const consumptionIndex = parseInt(index);
        if (
            consumptionIndex < 0 ||
            consumptionIndex >=
                this.params!.item.system.activation!.consumption.length
        )
            return;

        this.params!.item.system.activation!.consumption.splice(
            consumptionIndex,
            1,
        );

        void this.application.item.update({
            system: {
                activation: {
                    consumption:
                        this.params!.item.system.activation!.consumption.map(
                            (c) => c.toObject(),
                        ),
                },
            },
        });
    }

    /* --- Context --- */

    public _prepareContext(
        params: ResourceConsumptionListComponent.Params,
        context: BaseItemSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,
            ...params,
            isAction: params.item.isAction(),
        });
    }
}

export namespace ResourceConsumptionListComponent {
    export interface Params {
        item: ActionItem;
        disabled?: boolean;
    }
}

// Register the component
ResourceConsumptionListComponent.register('app-item-resource-consumption-list');
