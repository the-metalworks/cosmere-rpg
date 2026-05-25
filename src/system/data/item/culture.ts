import { CosmereItem } from '@src/system/documents';

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
    LinkedSkillsItemDataSchema} from './mixins/linked-skills';
import {
    LinkedSkillsMixin
} from './mixins/linked-skills';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
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
