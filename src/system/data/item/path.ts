import { PathType, Skill } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import {
    TalentsProviderMixin,
    TalentsProviderData,
} from './mixins/talents-provider';
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemData,
} from './mixins/linked-skills';
import {
    RelationshipsMixin,
    RelationshipsItemData,
} from './mixins/relationships';

export interface PathItemData
    extends IdItemData,
        TypedItemData<PathType>,
        DescriptionItemData,
        TalentsProviderData,
        EventsItemData,
        LinkedSkillsItemData,
        RelationshipsItemData {}

export class PathItemDataModel extends DataModelMixin<
    PathItemData,
    CosmereItem
>(
    IdItemMixin({ initialFromName: true }),
    TypedItemMixin<CosmereItem, PathType>({
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
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            // TODO: Advancements
        });
    }

    get typeLabel(): string {
        return CONFIG.COSMERE.paths.types[this.type].label;
    }
}
