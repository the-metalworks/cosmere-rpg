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

export type EffectsContainerItemDataSchema = IdItemDataSchema &
    DescriptionItemDataSchema &
    EventsItemDataSchema &
    RelationshipsItemDataSchema;

export class EffectsContainerItemDataModel extends DataModelMixin<EffectsContainerItemDataSchema>(
    IdItemMixin({
        initial: 'none',
        choices: () => ['none', ...Object.keys(CONFIG.COSMERE.cultures)],
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.EffectsContainer.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {}
