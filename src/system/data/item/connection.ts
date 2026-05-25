import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema
} from './mixins/relationships';
import {
    RelationshipsMixin
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
