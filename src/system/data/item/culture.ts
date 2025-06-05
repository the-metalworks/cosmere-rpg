import { CosmereItem } from '@src/system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemData,
} from './mixins/linked-skills';

export interface CultureItemData
    extends IdItemData,
        DescriptionItemData,
        EventsItemData,
        LinkedSkillsItemData {}

export class CultureItemDataModel extends DataModelMixin<
    CultureItemData,
    CosmereItem
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
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {});
    }
}
