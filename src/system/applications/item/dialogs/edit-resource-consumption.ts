import { ItemConsumeType } from '@system/types/cosmere';
import {
    type AnyObject,
    type AnyMutableObject,
    type NumberRange,
    NONE,
} from '@system/types/utils';

// Documents
import { ActionItem } from '@system/documents/item';

// Component imports
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

export class EditResourceConsumptionDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            title: 'DIALOG.EditResourceConsumption.Title',
            minimizable: false,
            resizable: false,
            positioned: true,
        },
        classes: ['dialog', 'edit-resource-consumption'],
        tag: 'dialog',
        position: {
            width: 500,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_EDIT_RESOURCE_CONSUMPTION}`,
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private constructor(
        public item: ActionItem,
        private consumptionIndex: number,
    ) {
        super({
            id: `${item.uuid}.ResourceConsumption.${consumptionIndex}`,
        });
    }

    /* --- Statics --- */

    public static async show(item: ActionItem, consumptionIndex: number) {
        const dialog = new this(item, consumptionIndex);
        await dialog.render(true);
    }

    /* --- Accessors --- */

    public get consumption() {
        return this.item.system.activation!.consumption[this.consumptionIndex];
    }

    /* --- Form --- */

    protected static async onFormEvent(
        this: EditResourceConsumptionDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        // Ignore submit events
        if (event instanceof SubmitEvent) return;

        event.preventDefault();

        const formDataObject = structuredClone(formData.object);
        if (
            event.target instanceof HTMLInputElement &&
            event.target.name === 'value'
        ) {
            foundry.utils.setProperty(
                formDataObject,
                'value',
                this.parseNumberRange(event.target.value),
            );
        }

        this.consumption.updateSource(formDataObject);

        await this.item.update({
            system: {
                activation: {
                    consumption: this.item.system.activation!.consumption.map(
                        (c) => c.toObject(),
                    ),
                },
            },
        });
        void this.render();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    /* --- Context --- */

    public _prepareContext() {
        const consumption = this.consumption;

        const expectedDocumentType =
            consumption.type === ItemConsumeType.Resource
                ? Actor.documentName
                : consumption.type === ItemConsumeType.ItemResource
                  ? Item.documentName
                  : undefined;

        return Promise.resolve({
            editable: true,
            item: this.item,
            consume: consumption,
            expectedDocumentType,
        });
    }

    /* --- Helpers --- */

    private parseNumberRange(value: string): NumberRange | null {
        try {
            const range: NumberRange = {
                min: 0,
                max: 0,
            };

            const valueParts = value.split('-');

            if (valueParts.length === 1) {
                value = valueParts[0];
                const isRange = value.endsWith('+');

                const parsed = parseInt(value);
                if (!isNaN(parsed)) {
                    range.min = parsed;
                    range.max = isRange ? -1 : parsed;
                }
            } else {
                const base = parseInt(valueParts[0]);
                const cap = parseInt(valueParts[1]);

                if (!isNaN(base)) {
                    range.min = base;
                }

                if (!isNaN(cap)) {
                    range.max = cap;
                } else {
                    range.max = range.min;
                }
            }

            return range;
        } catch {
            return null;
        }
    }
}
