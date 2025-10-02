import {
    HandlerType,
} from '@system/types/item/event-system';

export const BASE_SCHEMA = (type: HandlerType | 'none') => ({
    type: new foundry.data.fields.StringField({
        required: true,
        initial: type,
        blank: false,
        choices: () => ({
            none: 'None',
            ...Object.entries(
                CONFIG.COSMERE.items.events.handlers,
            ).reduce(
                (choices, [id, config]) => ({
                    ...choices,
                    [id]: config.label,
                }),
                {},
            ),
        }) as Record<HandlerType | 'none', string>,
        label: 'Type',
    }),
});

export type HandlerBaseSchema = ReturnType<typeof BASE_SCHEMA>;
export type HandlerBaseData = foundry.data.fields.SchemaField.InitializedData<HandlerBaseSchema>;