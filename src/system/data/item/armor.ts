import { EquipType, ArmorTraitId } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EquippableItemMixin, EquippableItemData } from './mixins/equippable';
import { TraitsItemMixin, TraitsItemData } from './mixins/traits';
import { PhysicalItemMixin, PhysicalItemData } from './mixins/physical';
import { ExpertiseItemMixin, ExpertiseItemData } from './mixins/expertise';
import { EventsItemMixin, EventsItemData } from './mixins/events';

export interface ArmorItemData
    extends IdItemData,
        DescriptionItemData,
        EquippableItemData,
        ExpertiseItemData,
        TraitsItemData<ArmorTraitId>,
        PhysicalItemData,
        EventsItemData {
    deflect: number;
}

export class ArmorItemDataModel extends DataModelMixin<
    ArmorItemData,
    CosmereItem
>(
    IdItemMixin({
        initial: 'none',
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Armor.desc_placeholder',
    }),
    EquippableItemMixin({
        equipType: {
            initial: EquipType.Wear,
            choices: [EquipType.Wear],
        },
    }),
    ExpertiseItemMixin(),
    TraitsItemMixin(),
    PhysicalItemMixin(),
    EventsItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            deflect: new foundry.data.fields.NumberField({
                required: true,
                initial: 0,
                min: 0,
                integer: true,
            }),
        });
    }
}
