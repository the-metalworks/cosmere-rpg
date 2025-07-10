import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemData,
} from './mixins/relationships';

/**
 * NOTE: Kept interface with no members for consistency with
 * other item data.
 */

export interface ConnectionItemData
    extends DescriptionItemData,
        EventsItemData,
        RelationshipsItemData {}

export class ConnectionItemDataModel extends DataModelMixin<
    ConnectionItemData,
    CosmereItem
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Connection.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {});
    }
}
