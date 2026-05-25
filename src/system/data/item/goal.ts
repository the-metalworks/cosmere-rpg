import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import type { IdItemDataSchema } from './mixins/id';
import { IdItemMixin } from './mixins/id';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
} from './mixins/relationships';

const SCHEMA = () => ({
    level: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        max: 3,
        initial: 0,
        label: 'COSMERE.Item.Goal.Level.Label',
    }),
});

export type GoalItemDataSchema = 
    & ReturnType<typeof SCHEMA>
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
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }
}
