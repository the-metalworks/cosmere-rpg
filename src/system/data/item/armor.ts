import { EquipType, ArmorTraitId, DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';
import type { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import type { IdItemDataSchema } from './mixins/id';
import { IdItemMixin } from './mixins/id';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import { ResourcesItemMixin } from './mixins/resources';
import type {
    EquippableItemDataSchema} from './mixins/equippable';
import {
    EquippableItemMixin
} from './mixins/equippable';
import type {
    ExpertiseItemDataSchema} from './mixins/expertise';
import {
    ExpertiseItemMixin
} from './mixins/expertise';
import type {
    TraitsItemDataSchema,
    TraitsItemDerivedData} from './mixins/traits';
import {
    TraitsItemMixin
} from './mixins/traits';
import type { DeflectItemDataSchema } from './mixins/deflect';
import { DeflectItemMixin } from './mixins/deflect';
import type {
    PhysicalItemDataSchema,
    PhysicalItemDerivedData} from './mixins/physical';
import {
    PhysicalItemMixin
} from './mixins/physical';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    LinkedSkillsItemDataSchema} from './mixins/linked-skills';
import {
    LinkedSkillsMixin
} from './mixins/linked-skills';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
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
