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
                            initial: params?.value ? params.value : '',
                        }),
                        chat: new foundry.data.fields.HTMLField({
                            label: 'Chat description',
                            initial: params?.chat ? params.chat : '',
                        }),
                        short: new foundry.data.fields.StringField({
                            initial: params?.short ? params.short : '',
                        }),
                    }),
                });
            }
        };
    };
}
