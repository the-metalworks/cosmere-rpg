import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';

/**
 * NOTE: Kept interface with no members for consistency with
 * other item data.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConnectionItemData extends DescriptionItemData {}

export class ConnectionItemDataModel extends DataModelMixin<
    ConnectionItemData,
    CosmereItem
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Connection.desc_placeholder',
    }),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {});
    }
}
