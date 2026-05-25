import { CosmereItem } from '@src/system/documents';
import type { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import type { PhysicalItemDataSchema, PhysicalItemDerivedData } from './mixins/physical';
import { PhysicalItemMixin } from './mixins/physical';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
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
