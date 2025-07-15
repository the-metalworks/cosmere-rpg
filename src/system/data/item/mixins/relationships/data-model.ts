import {
    ItemRelationshipData,
    ItemRelationshipType,
    ItemRelationshipRemovalPolicy,
} from './types';

export class ItemRelationship extends foundry.abstract
    .DataModel<ItemRelationshipData> {
    static defineSchema() {
        return {
            id: new foundry.data.fields.StringField({
                initial: () => foundry.utils.randomID(),
                required: true,
                blank: false,
            }),
            type: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                choices: [
                    ItemRelationshipType.Parent,
                    ItemRelationshipType.Child,
                ],
            }),
            uuid: new foundry.data.fields.DocumentUUIDField({
                required: true,
                nullable: false,
                blank: false,
            }),
            itemType: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                choices: () => Object.keys(CONFIG.COSMERE.items.types),
            }),
            removalPolicy: new foundry.data.fields.StringField({
                required: false,
                initial: ItemRelationshipRemovalPolicy.Keep,
                blank: false,
                choices: [
                    ItemRelationshipRemovalPolicy.Remove,
                    ItemRelationshipRemovalPolicy.Keep,
                ],
            }),
        };
    }
}

export namespace ItemRelationship {
    export import Type = ItemRelationshipType;
    export import RemovalPolicy = ItemRelationshipRemovalPolicy;
}
