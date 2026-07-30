import { ItemConsumeType } from '@system/types/cosmere';
import type { AnyObject } from '@system/types/utils';

// Documents
import { ActionItem } from '@system/documents/item';

// Data
import { ActionItemDataModel } from '@system/data/item/action';

// Component imports
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

const { ApplicationV2 } = foundry.applications.api;

interface ConsumeDataState {
    shouldConsume: boolean;
}

export class ItemConsumeDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            title: 'DIALOG.ItemConsume.Title',
            minimizable: false,
            resizable: false,
            positioned: true,
        },
        classes: ['dialog', 'item-consume'],
        tag: 'dialog',
        position: {
            width: 450,
        },
        actions: {
            continue: this.onContinue,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_CONSUME}`,
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

    private consumeData: ActionItemDataModel.ConsumeData[];
    private consumeDataState: ConsumeDataState[];

    private hasResolved = false;

    private constructor(
        private item: ActionItem,
        private resolve: (
            result: ActionItemDataModel.ConsumeData[] | null,
        ) => void,
    ) {
        super({
            id: `${item.uuid}.consume`,
        });

        this.consumeData = item.system.activation!.consumption.map(
            (consume) => {
                const clone = consume.clone();
                clone.value.actual = clone.value.min;

                return clone;
            },
        );
        this.consumeDataState = this.consumeData.map(() => ({
            shouldConsume: true,
        }));
    }

    public static show(
        item: ActionItem,
    ): Promise<ActionItemDataModel.ConsumeData[] | null> {
        return new Promise((resolve) => {
            void new this(item, resolve).render(true);
        });
    }

    /* --- Actions --- */

    private static onContinue(this: ItemConsumeDialog) {
        this.resolve(
            this.consumeData.filter(
                (_, index) => this.consumeDataState[index].shouldConsume,
            ),
        );

        this.hasResolved = true;
        void this.close();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: ItemConsumeDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        // Ignore submit events
        if (event instanceof SubmitEvent) return;

        event.preventDefault();

        const formDataObject = formData.object;

        this.consumeData.forEach((consume, index) => {
            let value = Number(
                foundry.utils.getProperty(formDataObject, `[${index}].value`),
            );
            if (isNaN(value)) value = consume.value.actual;

            const shouldConsume = Boolean(
                foundry.utils.getProperty(
                    formDataObject,
                    `[${index}].shouldConsume`,
                ),
            );

            consume.value.actual = Math.max(
                consume.value.min,
                Math.min(
                    consume.value.max === -1 ? value : consume.value.max,
                    value,
                ),
            );
            this.consumeDataState[index].shouldConsume = shouldConsume;
        });

        void this.render();
    }

    /* --- Lifecycle --- */

    protected async _onRender(context: AnyObject, options: AnyObject) {
        await super._onRender(context, options);

        $(this.element).prop('open', true);
    }

    protected _onClose() {
        super._onClose();

        if (this.hasResolved) return;

        this.resolve(null);
        this.hasResolved = true;
    }

    /* --- Context --- */

    public _prepareContext() {
        return Promise.resolve({
            item: this.item,
            CONFIG,
            consumption: this.consumeData.map((c, i) => {
                const isStaticAmount = c.value.min === c.value.max;
                const isCappedAmount = !isStaticAmount && c.value.max !== -1;

                const resourceLabel =
                    c.type === ItemConsumeType.Resource
                        ? CONFIG.COSMERE.resources[c.resource].label
                        : c.type === ItemConsumeType.ItemResource
                          ? CONFIG.COSMERE.item.resource.types[c.resource].label
                          : 'UNKNOWN';

                return {
                    ...c,
                    ...this.consumeDataState[i],
                    isStaticAmount,
                    isCappedAmount,
                    resourceLabel,
                };
            }),
        });
    }
}
