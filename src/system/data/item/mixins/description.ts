import { CosmereItem } from '@system/documents';

export interface DescriptionItemData {
    description?: {
        value?: string;
        chat?: string;
        short?: string;
    };
}

export interface InitialDescriptionItemValues {
    value: string;
    short?: string;
    chat?: string;
}

export function DescriptionItemMixin<P extends CosmereItem>(
    params?: InitialDescriptionItemValues,
) {
    return (
        base: typeof foundry.abstract.TypeDataModel<DescriptionItemData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    description: new foundry.data.fields.SchemaField({
                        value: new foundry.data.fields.HTMLField({
                            label: 'Description',
                            initial: params?.value
                                ? `<p>${game.i18n!.localize(params.value)}</p>`
                                : '',
                        }),
                        chat: new foundry.data.fields.HTMLField({
                            label: 'Chat description',
                            initial: params?.chat
                                ? `<p>${game.i18n!.localize(params.chat)}</p>`
                                : '',
                        }),
                        short: new foundry.data.fields.StringField({
                            initial: params?.short
                                ? `<p>${game.i18n!.localize(params.short)}</p>`
                                : '',
                        }),
                    }),
                });
            }
        };
    };
}
