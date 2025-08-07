import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { PhysicalItemMixin, PhysicalItemDataSchema } from './mixins/physical';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = {
    isMoney: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
        label: 'COSMERE.Item.Loot.isMoney',
        nullable: false,
    }),
};

export type LootItemDataSchema = 
    & typeof SCHEMA
    & DescriptionItemDataSchema
    & PhysicalItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export class LootItemDataModel extends DataModelMixin<
    LootItemDataSchema
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Loot.desc_placeholder',
    }),
    PhysicalItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }
}
