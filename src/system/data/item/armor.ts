import { EquipType, ArmorTraitId, DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';
import { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
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
    ExpertiseItemMixin,
    ExpertiseItemDataSchema,
} from './mixins/expertise';
import {
    TraitsItemMixin,
    TraitsItemDataSchema,
    TraitsItemDerivedData,
} from './mixins/traits';
import { DeflectItemMixin, DeflectItemDataSchema } from './mixins/deflect';
import {
    PhysicalItemMixin,
    PhysicalItemDataSchema,
    PhysicalItemDerivedData,
} from './mixins/physical';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type ArmorItemDataSchema = IdItemDataSchema &
    DescriptionItemDataSchema &
    EquippableItemDataSchema<{
        equipType: { initial: EquipType.Wear; choices: [EquipType.Wear] };
    }> &
    ResourcesItemMixin.Schema &
    ExpertiseItemDataSchema &
    TraitsItemDataSchema &
    DeflectItemDataSchema &
    PhysicalItemDataSchema &
    EventsItemDataSchema &
    LinkedSkillsItemDataSchema &
    RelationshipsItemDataSchema;

export type ArmorItemDerivedData = PhysicalItemDerivedData &
    TraitsItemDerivedData;

export class ArmorItemDataModel extends DataModelMixin<
    ArmorItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    ArmorItemDerivedData
>(
    IdItemMixin({
        initial: 'none',
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Armor.desc_placeholder',
    }),
    EquippableItemMixin({
        alwaysEquippable: true,
        equipType: {
            initial: EquipType.Wear,
            choices: [EquipType.Wear],
        },
    }),
    ResourcesItemMixin(),
    ExpertiseItemMixin(),
    TraitsItemMixin(),
    DeflectItemMixin(),
    PhysicalItemMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {}
