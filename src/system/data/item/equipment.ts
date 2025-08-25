import { EquipmentType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';
import { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import { TypedItemMixin, TypedItemDataSchema, TypedItemDerivedData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { PhysicalItemMixin, PhysicalItemDataSchema, PhysicalItemDerivedData } from './mixins/physical';
import {
    ActivatableItemMixin,
    ActivatableItemDataSchema,
} from './mixins/activatable';
import { DamagingItemMixin, DamagingItemDataSchema } from './mixins/damaging';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type EquipmentItemDataSchema = 
    & TypedItemDataSchema<EquipmentType>
    & DescriptionItemDataSchema
    & PhysicalItemDataSchema
    & ActivatableItemDataSchema
    & DamagingItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export type EquipmentItemDerivedData = 
    & TypedItemDerivedData 
    & PhysicalItemDerivedData;

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
    PhysicalItemMixin(),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {}
