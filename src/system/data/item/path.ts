import { PathType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import type { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import type { IdItemDataSchema } from './mixins/id';
import { IdItemMixin } from './mixins/id';
import type { TypedItemDataSchema, TypedItemDerivedData } from './mixins/typed';
import { TypedItemMixin } from './mixins/typed';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import type {
    TalentsProviderDataSchema} from './mixins/talents-provider';
import {
    TalentsProviderMixin
} from './mixins/talents-provider';
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

export type PathItemDataSchema =
    & IdItemDataSchema
    & TypedItemDataSchema<PathType>
    & DescriptionItemDataSchema
    & TalentsProviderDataSchema
    & EventsItemDataSchema
    & LinkedSkillsItemDataSchema
    & RelationshipsItemDataSchema;

export type PathItemDerivedData = TypedItemDerivedData;

export class PathItemDataModel extends DataModelMixin<
    PathItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    PathItemDerivedData
>(
    IdItemMixin({ initialFromName: true }),
    TypedItemMixin({
        initial: PathType.Heroic,
        choices: () => {
            return Object.entries(CONFIG.COSMERE.paths.types).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value.label,
                }),
                {} as Record<PathType, string>,
            );
        },
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Path.desc_placeholder',
    }),
    TalentsProviderMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {
    get typeLabel(): string {
        return CONFIG.COSMERE.paths.types[this.type].label;
    }
}
