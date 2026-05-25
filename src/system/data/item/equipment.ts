import { EquipmentType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';
import type { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import type {
    TypedItemDataSchema,
    TypedItemDerivedData} from './mixins/typed';
import {
    TypedItemMixin
} from './mixins/typed';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import { ResourcesItemMixin } from './mixins/resources';
import type {
    PhysicalItemDataSchema,
    PhysicalItemDerivedData} from './mixins/physical';
import {
    PhysicalItemMixin
} from './mixins/physical';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
} from './mixins/relationships';
import type {
    EquippableItemDataSchema} from './mixins/equippable';
import {
    EquippableItemMixin
} from './mixins/equippable';

export type EquipmentItemDataSchema = TypedItemDataSchema<EquipmentType> &
    DescriptionItemDataSchema &
    ResourcesItemMixin.Schema &
    PhysicalItemDataSchema &
    EventsItemDataSchema &
    RelationshipsItemDataSchema &
    EquippableItemDataSchema;

export type EquipmentItemDerivedData = TypedItemDerivedData &
    PhysicalItemDerivedData;

export class EquipmentItemDataModel extends DataModelMixin<
    EquipmentItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    EquipmentItemDerivedData
>(
    TypedItemMixin({
        initial: EquipmentType.Basic,
        choices: () =>
            Object.entries(CONFIG.COSMERE.items.equipment.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<EquipmentType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Equipment.desc_placeholder',
    }),
    ResourcesItemMixin(),
    PhysicalItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
    EquippableItemMixin(),
) {}
