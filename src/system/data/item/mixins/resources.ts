import type {
    ItemResource,
    ItemResourceRechargeType,
} from '@system/types/cosmere';
import type { ItemResourceConfig } from '@system/types/config';

// Utils
import { NONE, type Noneable } from '@system/types/utils';

function defineItemResourceSchema(config: ItemResourceConfig) {
    return {
        key: new foundry.data.fields.StringField({
            required: true,
            initial: config.key,
            blank: false,
            choices: [config.key],
            label: 'COSMERE.Item.Resource.Key.Label',
        }),
        value: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            min: 0,
            initial: 0,
            integer: true,
            label: 'COSMERE.Item.Resource.Value.Label',
        }),
        max: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            min: 1,
            initial: 1,
            integer: true,
            label: 'COSMERE.Item.Resource.Max.Label',
        }),
        recharge: new foundry.data.fields.StringField({
            nullable: true,
            initial: null,
            choices: {
                none: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.item.resource.recharge.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {} as Record<ItemResourceRechargeType, string>,
                ),
            },
            coerce: (value: unknown) => (value === '' ? null : value),
            label: 'COSMERE.Item.Resource.Recharge.Label',
        }),
    };
}

function defineMixinSchema() {
    const resourceConfigs = Object.entries(
        CONFIG.COSMERE.item.resource.types,
    ) as [ItemResource, ItemResourceConfig][];

    return {
        primaryResource: new foundry.data.fields.StringField({
            required: true,
            blank: false,
            choices: {
                [NONE]: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.item.resource.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {} as Record<ItemResource, string>,
                ),
            },
            initial: NONE,
            label: 'COSMERE.Item.PrimaryResource.Label',
        }),
        resources: new foundry.data.fields.SchemaField(
            resourceConfigs.reduce(
                (schemas, [_, config]) => ({
                    ...schemas,
                    [config.key]: new foundry.data.fields.SchemaField(
                        defineItemResourceSchema(config),
                        {
                            required: true,
                            nullable: true,
                            initial: null,
                            label: config.label,
                        },
                    ),
                }),
                {} as Record<
                    ItemResource,
                    foundry.data.fields.SchemaField<
                        ReturnType<typeof defineItemResourceSchema>
                    >
                >,
            ),
        ),
    };
}

export function ResourcesItemMixin<TParent extends Item.Implementation>() {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<ResourcesItemMixin.Schema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(
                    super.defineSchema(),
                    defineMixinSchema(),
                );
            }
        };
    };
}

export namespace ResourcesItemMixin {
    export type Schema = ReturnType<typeof defineMixinSchema>;
}
