import { ActionType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';
import { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import { TypedItemMixin, TypedItemDataSchema, TypedItemDerivedData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import {
    ActivatableItemMixin,
    ActivatableItemDataSchema,
} from './mixins/activatable';
import { DamagingItemMixin, DamagingItemDataSchema } from './mixins/damaging';
import { ModalityItemMixin, ModalityItemDataSchema } from './mixins/modality';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = {
    ancestry: new foundry.data.fields.StringField({
        required: false,
        nullable: true,
        initial: null,
        label: 'COSMERE.Item.Action.Ancestry.Label',
        hint: 'COSMERE.Item.Action.Ancestry.Hint',
    }),
};

export type ActionItemDataSchema = 
    & typeof SCHEMA 
    & IdItemDataSchema
    & TypedItemDataSchema<ActionType>
    & DescriptionItemDataSchema
    & ActivatableItemDataSchema
    & DamagingItemDataSchema
    & ModalityItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export type ActionItemDerivedData = TypedItemDerivedData;

export class ActionItemDataModel extends DataModelMixin<
    ActionItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    ActionItemDerivedData
>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: ActionType.Basic,
        choices: () =>
            Object.entries(CONFIG.COSMERE.action.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<ActionType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Action.desc_placeholder',
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    ModalityItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }
}
