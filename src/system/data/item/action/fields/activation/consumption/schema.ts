import { ItemConsumeType, Resource, ItemResource } from '@system/types/cosmere';

// Fields
import { StringField } from '@system/data/fields/string-field';
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Utils
import { NONE, type Noneable } from '@system/types/utils';
import { DocumentTarget } from '@system/utils/match-document';

/* --- Schemas --- */

function defineBaseSchema() {
    return {
        type: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            choices: {
                [NONE]: 'GENERIC.None',
                ...Object.entries(
                    CONFIG.COSMERE.item.activation.consumption.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {} as Record<ItemConsumeType, string>,
                ),
            },
            initial: ItemConsumeType.Resource,
            label: 'COSMERE.Item.Activation.ResourceConsumption.Type.Label',
        }),
        value: new foundry.data.fields.SchemaField(
            {
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
            },
            {
                label: 'COSMERE.Item.Activation.ResourceConsumption.Value.Label',
            },
        ),
    };
}

export function defineConsumeActorResourceSchema() {
    return {
        ...defineBaseSchema(),
        resource: new StringField({
            required: true,
            blank: false,
            choices: Object.entries(CONFIG.COSMERE.resources).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<Resource, string>,
            ),
            initial: Resource.Focus,
            allowFallback: true,
            label: 'COSMERE.Item.Activation.ResourceConsumption.Type.ActorResource.Resource.Label',
        }),
        matchDocument: new MatchDocumentField({
            required: true,
            documentType: 'Actor',
            initial: {
                steps: [
                    //@ts-expect-error foundry-vtt-types resolves this to MatchDocumentStepDataModel, even though MatchDocumentStepField.AssignmentType is valid
                    { target: DocumentTarget.Parent },
                ],
            },
        }),
    };
}

export function defineConsumeItemResourceSchema() {
    return {
        ...defineBaseSchema(),
        resource: new StringField({
            required: true,
            blank: false,
            choices: Object.entries(CONFIG.COSMERE.item.resource.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<ItemResource, string>,
            ),
            initial: ItemResource.Uses,
            allowFallback: true,
            label: 'COSMERE.Item.Activation.ResourceConsumption.Type.ItemResource.Resource.Label',
        }),
        matchDocument: new MatchDocumentField({
            required: true,
            documentType: 'Item',
            initial: {
                steps: [
                    //@ts-expect-error foundry-vtt-types resolves this to MatchDocumentStepDataModel, even though MatchDocumentStepField.AssignmentType is valid
                    { target: DocumentTarget.Self },
                ],
            },
        }),
    };
}

export type ActivationConsumptionBaseSchema = ReturnType<
    typeof defineBaseSchema
>;
export type ConsumeActorResourceSchema = ReturnType<
    typeof defineConsumeActorResourceSchema
>;
export type ConsumeItemResourceSchema = ReturnType<
    typeof defineConsumeItemResourceSchema
>;

export type ActivationConsumptionSchema =
    | ActivationConsumptionBaseSchema
    | ConsumeActorResourceSchema
    | ConsumeItemResourceSchema;
export type ActivationConsumptionSchemaByType<
    T extends Noneable<ItemConsumeType>,
> = T extends typeof NONE
    ? ActivationConsumptionBaseSchema
    : T extends ItemConsumeType.Resource
      ? ConsumeActorResourceSchema
      : T extends ItemConsumeType.ItemResource
        ? ConsumeItemResourceSchema
        : never;

/* --- Data Models --- */

function constructDataModelForType<Type extends Noneable<ItemConsumeType>>(
    type: Type,
) {
    return class extends foundry.abstract.DataModel<
        ActivationConsumptionSchemaByType<Type>,
        foundry.abstract.DataModel.Any
    > {
        static defineSchema() {
            switch (type) {
                case NONE:
                    return defineBaseSchema();
                case ItemConsumeType.Resource:
                    return defineConsumeActorResourceSchema();
                case ItemConsumeType.ItemResource:
                    return defineConsumeItemResourceSchema();
                default:
                    throw new Error(`Unsupported consume type: ${type}`);
            }
        }
    };
}

export const NoneConsumptionDataModel = constructDataModelForType(NONE);
export type NoneConsumptionDataModel = InstanceType<
    typeof NoneConsumptionDataModel
>;

export const ConsumeActorResourceDataModel = constructDataModelForType(
    ItemConsumeType.Resource,
);
export type ConsumeActorResourceDataModel = InstanceType<
    typeof ConsumeActorResourceDataModel
>;

export const ConsumeItemResourceDataModel = constructDataModelForType(
    ItemConsumeType.ItemResource,
);
export type ConsumeItemResourceDataModel = InstanceType<
    typeof ConsumeItemResourceDataModel
>;

export type ActivationConsumptionDataModel =
    | (NoneConsumptionDataModel & { type: typeof NONE })
    | (ConsumeActorResourceDataModel & { type: ItemConsumeType.Resource })
    | (ConsumeItemResourceDataModel & { type: ItemConsumeType.ItemResource });

export function getDataModelForConsumeType<
    Type extends Noneable<ItemConsumeType>,
>(type: Type) {
    switch (type) {
        case NONE:
            return NoneConsumptionDataModel;
        case ItemConsumeType.Resource:
            return ConsumeActorResourceDataModel;
        case ItemConsumeType.ItemResource:
            return ConsumeItemResourceDataModel;
        default:
            throw new Error(`Unsupported consume type: ${type}`);
    }
}
