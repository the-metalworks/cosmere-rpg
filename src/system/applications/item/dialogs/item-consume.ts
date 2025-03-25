import { SYSTEM_ID } from '@src/system/constants';
import { CosmereItem } from '@src/system/documents';
import { TEMPLATES } from '@src/system/utils/templates';

// Constants
const TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.DIALOG_ITEM_CONSUME}`;

interface ItemConsumeDialogOptions {
    /**
     * The amount to consume
     */
    amount?: number;

    /**
     * The resource or item to consume
     */
    resource?: string;

    /**
     * Whether or not to carry out the consume.
     */
    shouldConsume?: boolean;
}

interface ItemConsumeDialogResult {
    /**
     * Whether or not to carry out the consume.
     */
    shouldConsume: boolean;
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
        options: ItemConsumeDialogOptions = {},
    ): Promise<ItemConsumeDialogResult | null> {
        // Render dialog inner HTML
        const content = await renderTemplate(TEMPLATE, {
            label: game.i18n!.format('DIALOG.ItemConsume.ShouldConsume', {
                amount: options.amount ?? 0,
                resource:
                    options.resource ?? game.i18n!.localize('GENERIC.Unknown'),
            }),
            shouldConsume: options.shouldConsume ?? true,
        });

        // Render dialog and wrap as promise
        return new Promise((resolve) => {
            void new ItemConsumeDialog(item, resolve, content).render(true);
        });
    }

    /* --- Actions --- */

    private onContinue() {
        const form = this.element.querySelector('form')! as HTMLFormElement & {
            shouldConsume: HTMLInputElement;
        };

        // Resolve
        this.resolve({ shouldConsume: form.shouldConsume.checked });
    }
}
