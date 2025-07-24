import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { PhysicalItemMixin, PhysicalItemData } from './mixins/physical';

export interface LootItemData extends DescriptionItemData, PhysicalItemData {
    /**
     * Is this item a form of currency?
     * If so, its value will be added to the character's total.
     */
    isMoney: boolean;
}

export class LootItemDataModel extends DataModelMixin<
    LootItemData,
    CosmereItem
>(
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Loot.desc_placeholder',
    }),
    PhysicalItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            isMoney: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
            }),
        });
    }
}
