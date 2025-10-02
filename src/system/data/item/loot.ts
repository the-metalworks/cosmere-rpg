import { CosmereItem } from '@src/system/documents';
import { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { PhysicalItemMixin, PhysicalItemDataSchema, PhysicalItemDerivedData } from './mixins/physical';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = () => ({
    isMoney: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
        label: 'COSMERE.Item.Loot.isMoney',
        nullable: false,
    }),
});

export type LootItemDataSchema = 
    & ReturnType<typeof SCHEMA>
    & DescriptionItemDataSchema
    & PhysicalItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export type LootItemDerivedData = PhysicalItemDerivedData;

export class LootItemDataModel extends DataModelMixin<
    LootItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    LootItemDerivedData
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Loot.desc_placeholder',
    }),
    PhysicalItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }
}
