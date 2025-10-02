import { PathType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
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
    TalentsProviderMixin,
    TalentsProviderDataSchema,
} from './mixins/talents-provider';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
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
