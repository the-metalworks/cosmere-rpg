import {
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    Resource,
} from '@system/types/cosmere';

import { NONE } from '@system/types/utils';

export class ActivationField extends foundry.data.fields.SchemaField<
    ActivationField.Schema,
    ActivationField.Options
> {
    constructor(
        options?: ActivationField.Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(ActivationField.defineSchema(), options, context);
    }

    public static defineSchema() {
        return {
            type: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: ActivationType.None as ActivationType,
                choices: Object.entries(
                    CONFIG.COSMERE.item.activation.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {} as Record<ActivationType, string>,
                ),
                label: 'COSMERE.Item.Sheet.Activation.Type',
            }),
            cost: new foundry.data.fields.SchemaField(
                {
                    value: new foundry.data.fields.NumberField({
                        nullable: true,
                        min: 0,
                        max: 3,
                        step: 1,
                        integer: true,
                    }),
                    type: new foundry.data.fields.StringField({
                        nullable: true,
                        choices: {
                            [NONE]: 'GENERIC.None',
                            ...Object.entries(
                                CONFIG.COSMERE.action.costs,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {} as Record<ActionCostType, string>,
                            ),
                        },
                        coerce: (value: unknown) =>
                            value === '' ? null : value,
                    }),
                },
                {
                    required: true,
                    label: 'COSMERE.Item.Sheet.Activation.Cost',
                },
            ),
            consumption: new foundry.data.fields.ArrayField(
                new foundry.data.fields.SchemaField(
                    {
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            choices: {
                                [NONE]: 'GENERIC.None',
                                ...Object.entries(
                                    CONFIG.COSMERE.item.activation.consumption
                                        .types,
                                ).reduce(
                                    (acc, [key, config]) => ({
                                        ...acc,
                                        [key]: config.label,
                                    }),
                                    {} as Record<ItemConsumeType, string>,
                                ),
                            },
                            initial: ItemConsumeType.Resource,
                        }),
                        value: new foundry.data.fields.SchemaField({
                            min: new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                min: 0,
                                integer: true,
                                initial: 0,
                            }),
                            max: new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                min: -1,
                                integer: true,
                                initial: 0,
                            }),
                            actual: new foundry.data.fields.NumberField({
                                required: false,
                                nullable: false,
                                min: 0,
                                integer: true,
                                initial: 0,
                            }),
                        }),
                        resource: new foundry.data.fields.StringField({
                            blank: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.resources,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {} as Record<Resource, string>,
                            ),
                            initial: Resource.Focus,
                        }),
                    },
                    {
                        required: true,
                        nullable: false,
                    },
                ),
                {
                    label: 'COSMERE.Item.Sheet.Activation.Consume',
                },
            ),
            flavor: new foundry.data.fields.HTMLField(),
        };
    }
}

export namespace ActivationField {
    export type Schema = ReturnType<typeof ActivationField.defineSchema>;

    export type Options =
        foundry.data.fields.SchemaField.Options<ActivationField.Schema>;

    export type InitializedData =
        foundry.data.fields.SchemaField.InitializedData<Schema>;
}
