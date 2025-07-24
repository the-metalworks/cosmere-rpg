import {
    WeaponId,
    WeaponTraitId,
    HoldType,
    EquipHand,
    WeaponType,
    EquipType,
} from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EquippableItemMixin, EquippableItemData } from './mixins/equippable';
import {
    ActivatableItemMixin,
    ActivatableItemData,
} from './mixins/activatable';
import { AttackingItemMixin, AttackingItemData } from './mixins/attacking';
import { DamagingItemMixin, DamagingItemData } from './mixins/damaging';
import { TraitsItemMixin, TraitsItemData } from './mixins/traits';
import { PhysicalItemMixin, PhysicalItemData } from './mixins/physical';
import { ExpertiseItemMixin, ExpertiseItemData } from './mixins/expertise';

export interface WeaponItemData
    extends IdItemData<WeaponId>,
        TypedItemData<WeaponType>,
        DescriptionItemData,
        EquippableItemData,
        ActivatableItemData,
        AttackingItemData,
        DamagingItemData,
        ExpertiseItemData,
        TraitsItemData<WeaponTraitId>,
        Partial<PhysicalItemData> {}

export class WeaponItemDataModel extends DataModelMixin<
    WeaponItemData,
    CosmereItem
>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: WeaponType.Light,
        choices: () =>
            Object.entries(CONFIG.COSMERE.weaponTypes).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<WeaponType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Weapon.desc_placeholder',
    }),
    EquippableItemMixin({
        equipType: {
            initial: EquipType.Hold,
            choices: [EquipType.Hold],
        },
    }),
    ActivatableItemMixin(),
    AttackingItemMixin(),
    DamagingItemMixin(),
    ExpertiseItemMixin(),
    TraitsItemMixin(),
    PhysicalItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {});
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        // Get active traits
        const activeTraits = this.traitsArray.filter((trait) => trait.active);

        // Check if Two Handed is active
        const twoHandedActive = activeTraits.some(
            (trait) => trait.id === WeaponTraitId.TwoHanded,
        );

        // Set hold type
        if (twoHandedActive) {
            this.equip.hold = HoldType.TwoHanded;
        } else {
            this.equip.hold = HoldType.OneHanded;
            this.equip.hand ??= EquipHand.Main;
        }
    }
}
