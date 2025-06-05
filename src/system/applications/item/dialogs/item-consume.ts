import { SYSTEM_ID } from '@src/system/constants';
import { ItemConsumeData } from '@src/system/data/item/mixins/activatable';
import { CosmereItem } from '@src/system/documents';
import { ItemConsumeType, Resource } from '@src/system/types/cosmere';
import { NumberRange } from '@src/system/types/utils';
import { TEMPLATES } from '@src/system/utils/templates';

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_CONSUME}`;

interface ItemConsumeDialogOptions {
    /**
     * The amount to consume
     */
    amount?: NumberRange;

    /**
     * The type of consumption
     */
    type?: ItemConsumeType;

    /**
     * The localized name of the resource or item to consume
     */
    resource?: string;

    /**
     * The id of the resource
     */
    resourceId?: string;

    /**
     * Whether or not to carry out the consume.
     */
    shouldConsume?: boolean;
}

interface ItemConsumeDialogResult {
    /**
     * Resource(s) to consume
     */
    consumption: ItemConsumeData[];
}

export class ItemConsumeDialog extends foundry.applications.api.DialogV2 {
    private constructor(
        private item: CosmereItem,
        private resolve: (result: ItemConsumeDialogResult | null) => void,
        content: string,
        title?: string,
    ) {
        super({
            id: `${item.uuid}.consume`,
            window: {
                title: title ?? 'DIALOG.ItemConsume.Title',
            },
            position: {
                width: 350,
            },
            content,
            buttons: [
                {
                    label: 'GENERIC.Button.Continue',
                    action: 'continue',
                    // NOTE: Callback must be async
                    // eslint-disable-next-line @typescript-eslint/require-await
                    callback: async () => this.onContinue(),
                },
            ],
        });
    }

    /* --- Lifecycle --- */

    protected _onClose() {
        this.resolve(null);
    }

    /* --- Statics --- */

    public static async show(
        item: CosmereItem,
        options: ItemConsumeDialogOptions[] = [],
    ): Promise<ItemConsumeDialogResult | null> {
        // Render dialog inner HTML
        const content = await renderTemplate(TEMPLATE, {
            resources: options.map((option, i) => {
                const resource =
                    option.resource ?? game.i18n!.localize('GENERIC.Unknown');
                let label = game.i18n!.localize(
                    'DIALOG.ItemConsume.ShouldConsume.None',
                );
                let isVariable = false;

                if (option.amount) {
                    // Static or optional consumption
                    if (option.amount.min === option.amount.max) {
                        label = game.i18n!.format(
                            'DIALOG.ItemConsume.ShouldConsume.Static',
                            {
                                amount: option.amount.min,
                                resource,
                            },
                        );
                    }
                    // Uncapped consumption
                    else if (option.amount.max === -1) {
                        label = game.i18n!.format(
                            'DIALOG.ItemConsume.ShouldConsume.RangeUncapped',
                            {
                                amount: option.amount.min,
                                resource,
                            },
                        );
                        isVariable = true;
                    }
                    // Capped consumption
                    else {
                        label = game.i18n!.format(
                            'DIALOG.ItemConsume.ShouldConsume.RangeCapped',
                            {
                                ...option.amount,
                                resource,
                            },
                        );
                        isVariable = true;
                    }
                }

                const resourceType = option.type ?? 'None';
                const resourceId = option.resourceId ?? 'None';
                const resourceAmount = option.amount
                    ? `${option.amount.min}-${option.amount.max === -1 ? 'INF' : option.amount.max}`
                    : '0-0';

                return {
                    id: `${resourceType}-${resourceId}-${resourceAmount}-${i}`,
                    label,
                    amount: isVariable ? option.amount : null,
                    shouldConsume: option.shouldConsume ?? false,
                };
            }),
        });

        // Render dialog and wrap as promise
        return new Promise((resolve) => {
            void new ItemConsumeDialog(item, resolve, content).render(true);
        });
    }

    /* --- Actions --- */

    private onContinue() {
        const form = this.element.querySelector('form')!;

        try {
            // Collate all valid consumption options, accumulating value
            // for all options which share the exact same target for
            // consumption.
            const collated = [
                ...form.querySelectorAll('#consumables .form-group').values(),
            ]
                .map((elem) => {
                    // Get inputs
                    const amountInput = elem.querySelector(
                        `#${elem.id}-amount`,
                    );
                    const shouldConsumeInput = elem.querySelector(
                        `#${elem.id}-shouldConsume`,
                    );

                    // Only consume checked elements
                    if (
                        !(shouldConsumeInput instanceof HTMLInputElement) ||
                        !shouldConsumeInput.checked
                    )
                        return null;

                    // Only consume from valid amount inputs, when present
                    if (
                        !!amountInput &&
                        !(amountInput instanceof HTMLInputElement)
                    )
                        return null;

                    // Get any additional information from the id
                    // Only destructure the first 4; the last value is the index,
                    // which only exists to assert uniqueness.
                    const [consumeType, consumeFrom, consumeMin, consumeMax] =
                        elem.id.split('-') as [
                            ItemConsumeType,
                            string,
                            string,
                            string,
                        ];
                    const consumeData = {
                        ...(consumeType === ItemConsumeType.Resource
                            ? {
                                  resource: consumeFrom as Resource,
                              }
                            : {}),
                    };

                    const min = parseInt(consumeMin);
                    const max = parseInt(consumeMax);

                    const range: NumberRange = {
                        min: isNaN(min) ? 0 : min,
                        max: isNaN(max) ? -1 : max,
                        actual: 0,
                    };

                    // Pass actual consumption back to item
                    if (range.min === range.max) {
                        range.actual = range.min;
                    } else if (amountInput) {
                        range.actual = amountInput.valueAsNumber;

                        // Validate input with useful error notification
                        if (isNaN(range.actual)) {
                            throw new Error(
                                `Invalid amount to consume: "${amountInput.value}"`,
                            );
                        } else if (
                            range.actual < range.min ||
                            (range.actual > range.max && range.max > -1)
                        ) {
                            let error = `Invalid amount "${range.actual}", must consume `;
                            if (range.max === -1) {
                                error += `at least ${range.min}`;
                            } else {
                                error += `between ${range.min} and ${range.max}`;
                            }
                            throw new Error(error);
                        }
                    }

                    return {
                        type: consumeType,
                        value: range,
                        ...consumeData,
                    };
                })
                .filter((elem) => !!elem)
                .reduce<Record<string, ItemConsumeData>>((acc, consumable) => {
                    // Get specific key, including the consume type and the actual
                    // value that's meant to be consumed.
                    let key = consumable.type as string;
                    switch (consumable.type) {
                        case ItemConsumeType.Resource:
                            key += `.${consumable.resource!}`;
                            break;
                    }

                    const existing = acc[key];
                    if (!existing) {
                        acc[key] = { ...consumable };
                    } else {
                        acc[key].value.actual! += consumable.value.actual!;
                    }

                    return acc;
                }, {});

            // Reconstruct list
            const consumption = Object.entries(collated).map(([_, v]) => v);

            console.log(consumption);

            // Resolve
            this.resolve({
                consumption,
            });
        } catch (error) {
            // Break free upon failed validation
            ui.notifications.warn((error as Error).message);
        }
    }
}
