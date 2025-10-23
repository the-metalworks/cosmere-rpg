import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

export type CultureItemDataSchema =
    & IdItemDataSchema
    & DescriptionItemDataSchema
    & EventsItemDataSchema
    & LinkedSkillsItemDataSchema
    & RelationshipsItemDataSchema;

export class CultureItemDataModel extends DataModelMixin<
    CultureItemDataSchema
>(
    IdItemMixin({
        initial: 'none',
        choices: () => ['none', ...Object.keys(CONFIG.COSMERE.cultures)],
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Culture.desc_placeholder',
    }),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {}
