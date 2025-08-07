import { EquipmentType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { TypedItemMixin, TypedItemDataSchema } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { PhysicalItemMixin, PhysicalItemDataSchema } from './mixins/physical';
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

export class EquipmentItemDataModel extends DataModelMixin<
    EquipmentItemDataSchema
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
