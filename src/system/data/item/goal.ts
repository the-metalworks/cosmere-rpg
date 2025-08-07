import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = {
    level: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        max: 3,
        initial: 0,
        label: 'COSMERE.Item.Goal.Level.Label',
    }),
};

export type GoalItemDataSchema = 
    & typeof SCHEMA
    & IdItemDataSchema
    & DescriptionItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export class GoalItemDataModel extends DataModelMixin<
    GoalItemDataSchema
>(
    IdItemMixin({
        initialFromName: true,
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Goal.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }
}
