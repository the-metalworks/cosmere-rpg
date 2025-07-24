import { CosmereItem } from '@system/documents/item';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import {
    ActivatableItemMixin,
    ActivatableItemData,
} from './mixins/activatable';

export interface TraitItemData
    extends DescriptionItemData,
        ActivatableItemData {}

/**
 * Item data model that represents adversary traits.
 * Not to be confused with weapon & armor traits
 */
export class TraitItemDataModel extends DataModelMixin<
    TraitItemData,
    CosmereItem
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Trait.desc_placeholder',
    }),
    ActivatableItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {});
    }
}
