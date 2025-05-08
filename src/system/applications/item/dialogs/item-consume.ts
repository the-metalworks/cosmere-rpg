import { SYSTEM_ID } from '@src/system/constants';
import { ItemConsumeData } from '@src/system/data/item/mixins/activatable';
import { CosmereItem } from '@src/system/documents';
import { ItemConsumeType, Resource } from '@src/system/types/cosmere';
import { TEMPLATES } from '@src/system/utils/templates';

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_CONSUME}`;

interface ItemConsumeDialogOptions {
    /**
     * The amount to consume
     */
    amount?: number;

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
            resources: options.map((option, i) => ({
                id: `${option.type ?? 'None'}-${option.resourceId ?? 'None'}-${option.amount ?? 'None'}-${i}`,
                label: game.i18n!.format('DIALOG.ItemConsume.ShouldConsume', {
                    amount: option.amount ?? 0,
                    resource:
                        option.resource ??
                        game.i18n!.localize('GENERIC.Unknown'),
                }),
                shouldConsume: option.shouldConsume ?? false,
            })),
        });

        // Render dialog and wrap as promise
        return new Promise((resolve) => {
            void new ItemConsumeDialog(item, resolve, content).render(true);
        });
    }

    /* --- Actions --- */

    private onContinue() {
        const form = this.element.querySelector('form')!;

        // Collate all valid consumption options, accumulating value
        // for all options which share the exact same target for
        // consumption.
        const collated = [
            ...form.querySelectorAll('#consumables .form-group input').values(),
        ]
            .map((elem) => {
                // Only consume checked elements
                if (!(elem instanceof HTMLInputElement) || !elem.checked)
                    return null;

                // Get any additional information from the id
                // Only destructure the first 3; the last value is the index,
                // which only exists to assert uniqueness.
                const [consumeType, consumeFrom, consumeVal] = elem.id.split(
                    '-',
                ) as [ItemConsumeType, string, string];
                const consumeData = {
                    ...(consumeType === ItemConsumeType.Resource
                        ? {
                              resource: consumeFrom as Resource,
                          }
                        : {}),
                };

                return {
                    type: consumeType,
                    value: parseInt(consumeVal) || 0,
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
                    acc[key].value += consumable.value;
                }

                return acc;
            }, {});

        // Reconstruct list
        const consumption = Object.entries(collated).map(([_, v]) => v);

        // Resolve
        this.resolve({
            consumption,
        });
    }
}
