import { EquipType } from '@system/types/cosmere';
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
import { ModalityItemMixin, ModalityItemDataSchema } from './mixins/modality';

export type GenericEquippableItemDataSchema = IdItemDataSchema &
    DescriptionItemDataSchema &
    EquippableItemDataSchema<{
        equipType: {
            initial: EquipType.Wear;
            choices: [EquipType.Wear, EquipType.Equip];
        };
    }> &
    ResourcesItemMixin.Schema &
    // TraitsItemDataSchema &
    DeflectItemDataSchema &
    PhysicalItemDataSchema &
    EventsItemDataSchema &
    LinkedSkillsItemDataSchema &
    RelationshipsItemDataSchema &
    ModalityItemDataSchema;

export type GenericEquippableItemDerivedData = PhysicalItemDerivedData; //&
// TraitsItemDerivedData;

export class GenericEquippableItemDataModel extends DataModelMixin<
    GenericEquippableItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    GenericEquippableItemDerivedData
>(
    IdItemMixin({
        initial: 'none',
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.GenericEquippable.desc_placeholder',
    }),
    EquippableItemMixin({
        equipType: {
            initial: EquipType.Equip,
            choices: [EquipType.Wear, EquipType.Equip],
        },
    }),
    ResourcesItemMixin(),
    // TraitsItemMixin(),
    DeflectItemMixin(),
    PhysicalItemMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
    ModalityItemMixin(),
) {}
