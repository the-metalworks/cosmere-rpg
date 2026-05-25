import {
    WeaponId,
    WeaponTraitId,
    HoldType,
    EquipHand,
    WeaponType,
    EquipType,
    ActivationType,
} from '@system/types/cosmere';
import { EmptyObject } from '@system/types/utils';

import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import {
    TypedItemMixin,
    TypedItemDataSchema,
    TypedItemDerivedData,
} from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { ResourcesItemMixin } from './mixins/resources';
import {
    EquippableItemMixin,
    EquippableItemDataSchema,
} from './mixins/equippable';
import {
    AttackingItemMixin,
    AttackingItemDataSchema,
} from './mixins/attacking';
import {
    TraitsItemMixin,
    TraitsItemDataSchema,
    TraitsItemDerivedData,
} from './mixins/traits';
import {
    PhysicalItemMixin,
    PhysicalItemDataSchema,
    PhysicalItemDerivedData,
} from './mixins/physical';
import {
    ExpertiseItemMixin,
    ExpertiseItemDataSchema,
} from './mixins/expertise';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type WeaponItemDataSchema = IdItemDataSchema &
    TypedItemDataSchema<WeaponType> &
    DescriptionItemDataSchema &
    ResourcesItemMixin.Schema &
    EquippableItemDataSchema<{
        equipType: { initial: EquipType.Hold; choices: [EquipType.Hold] };
    }> &
    AttackingItemDataSchema &
    ExpertiseItemDataSchema &
    TraitsItemDataSchema &
    PhysicalItemDataSchema &
    EventsItemDataSchema &
    LinkedSkillsItemDataSchema &
    RelationshipsItemDataSchema;

export type WeaponItemDerivedData = TypedItemDerivedData &
    PhysicalItemDerivedData &
    TraitsItemDerivedData;

type WeaponItemData =
    foundry.data.fields.SchemaField.InitializedData<WeaponItemDataSchema>;

export class WeaponItemDataModel extends DataModelMixin<
    WeaponItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    WeaponItemDerivedData
>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: WeaponType.Light,
        choices: () =>
            Object.entries(CONFIG.COSMERE.items.weapon.types).reduce(
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
    ResourcesItemMixin(),
    EquippableItemMixin({
        alwaysEquippable: true,
        equipType: {
            initial: EquipType.Hold,
            choices: [EquipType.Hold],
        },
    }),
    // ActivatableItemMixin({
    //     type: {
    //         initial: ActivationType.SkillTest,
    //     },
    //     skill: {
    //         allowDefault: true,
    //         defaultResolver: function (this: WeaponItemData) {
    //             return (
    //                 CONFIG.COSMERE.items.weapon.types[this.type].skill ?? null
    //             );
    //         },
    //         initial: 'default',
    //     },
    // }),
    AttackingItemMixin(),
    ExpertiseItemMixin(),
    TraitsItemMixin(),
    PhysicalItemMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {
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
