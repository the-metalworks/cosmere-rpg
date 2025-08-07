import { InjuryType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { TypedItemMixin, TypedItemDataSchema } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = {
    duration: new foundry.data.fields.SchemaField({
        initial: new foundry.data.fields.NumberField({
            nullable: true,
            integer: true,
            min: 0,
            initial: 1,
        }),
        remaining: new foundry.data.fields.NumberField({
            nullable: true,
            integer: true,
            min: 0,
            initial: 1,
        }),
    }),
};

export type InjuryItemDataSchema = 
    & typeof SCHEMA
    & TypedItemDataSchema<InjuryType>
    & DescriptionItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export class InjuryItemDataModel extends DataModelMixin<
    InjuryItemDataSchema
>(
    TypedItemMixin({
        // Default to flesh wound data as the least impactful injury type
        initial: InjuryType.FleshWound,
        choices: () =>
            Object.entries(CONFIG.COSMERE.injury.types).reduce(
                (acc, [key, { label }]) => ({
                    ...acc,
                    [key]: label,
                }),
                {} as Record<InjuryType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Injury.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }

    get typeLabel(): string {
        return CONFIG.COSMERE.injury.types[this.type].label;
    }
}
