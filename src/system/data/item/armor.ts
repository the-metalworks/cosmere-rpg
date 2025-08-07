import { EquipType, ArmorTraitId, DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { EquippableItemMixin, EquippableItemDataSchema } from './mixins/equippable';
import {
    ActivatableItemMixin,
    ActivatableItemDataSchema,
} from './mixins/activatable';
import { ExpertiseItemMixin, ExpertiseItemDataSchema } from './mixins/expertise';
import { TraitsItemMixin, TraitsItemDataSchema } from './mixins/traits';
import { DeflectItemMixin, DeflectItemDataSchema } from './mixins/deflect';
import { PhysicalItemMixin, PhysicalItemDataSchema } from './mixins/physical';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type ArmorItemDataSchema = 
    & IdItemDataSchema
    & DescriptionItemDataSchema
    & EquippableItemDataSchema<{ equipType: { initial: EquipType.Wear, choices: [EquipType.Wear] } }>
    & ActivatableItemDataSchema
    & ExpertiseItemDataSchema
    & TraitsItemDataSchema
    & DeflectItemDataSchema
    & PhysicalItemDataSchema
    & EventsItemDataSchema
    & LinkedSkillsItemDataSchema
    & RelationshipsItemDataSchema;

export class ArmorItemDataModel extends DataModelMixin<
    ArmorItemDataSchema
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
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {}
