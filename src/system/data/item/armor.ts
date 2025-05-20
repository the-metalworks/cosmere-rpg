import { EquipType, ArmorTraitId, DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EquippableItemMixin, EquippableItemData } from './mixins/equippable';
import {
    ActivatableItemMixin,
    ActivatableItemData,
} from './mixins/activatable';
import { TraitsItemMixin, TraitsItemData } from './mixins/traits';
import { DeflectItemMixin, DeflectItemData } from './mixins/deflect';
import { PhysicalItemMixin, PhysicalItemData } from './mixins/physical';
import { ExpertiseItemMixin, ExpertiseItemData } from './mixins/expertise';

export interface ArmorItemData
    extends IdItemData,
        DescriptionItemData,
        EquippableItemData,
        ActivatableItemData,
        ExpertiseItemData,
        TraitsItemData<ArmorTraitId>,
        DeflectItemData,
        PhysicalItemData {}

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
    ActivatableItemMixin(),
    ExpertiseItemMixin(),
    TraitsItemMixin(),
    DeflectItemMixin(),
    PhysicalItemMixin(),
) {}
