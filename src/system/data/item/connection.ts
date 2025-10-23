import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema
} from './mixins/relationships';

export type ConnectionItemDataSchema = 
    & DescriptionItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export class ConnectionItemDataModel extends DataModelMixin<
    ConnectionItemDataSchema
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Connection.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {}
