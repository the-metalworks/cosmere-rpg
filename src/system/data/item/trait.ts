import { CosmereItem } from '@system/documents/item';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { ResourcesItemMixin } from './mixins/resources';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type TraitItemDataSchema = DescriptionItemDataSchema &
    ResourcesItemMixin.Schema &
    EventsItemDataSchema &
    RelationshipsItemDataSchema;

/**
 * Item data model that represents adversary traits.
 * Not to be confused with weapon & armor traits
 */
export class TraitItemDataModel extends DataModelMixin<TraitItemDataSchema>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Trait.desc_placeholder',
    }),
    ResourcesItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {}
