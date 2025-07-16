import { CosmereItem } from '@system/documents';

import { CollectionField } from '@system/data/fields';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemData,
} from './mixins/relationships';

export interface GoalItemData
    extends IdItemData,
        DescriptionItemData,
        EventsItemData,
        RelationshipsItemData {
    /**
     * The progress level of the goal
     */
    level: number;
}

export class GoalItemDataModel extends DataModelMixin<
    GoalItemData,
    CosmereItem
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
        return foundry.utils.mergeObject(super.defineSchema(), {
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
    }
}
