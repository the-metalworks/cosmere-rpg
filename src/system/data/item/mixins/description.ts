import { CosmereItem } from '@system/documents';

export interface InitialDescriptionItemValues {
    value: string;
    short?: string;
    chat?: string;
}

const SCHEMA = (params?: InitialDescriptionItemValues) => ({
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

export type DescriptionItemDataSchema = ReturnType<typeof SCHEMA>;
export type DescriptionItemData = foundry.data.fields.SchemaField.InitializedData<DescriptionItemDataSchema>;

export function DescriptionItemMixin<TParent extends foundry.abstract.Document.Any>(
    params?: InitialDescriptionItemValues,
) {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<DescriptionItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA(params));
            }
        }
    };
}
