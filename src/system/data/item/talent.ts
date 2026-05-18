import { Talent } from '@system/types/item';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import { TypedItemMixin, TypedItemDataSchema } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import {
    ActivatableItemMixin,
    ActivatableItemDataSchema,
} from './mixins/activatable';
import { DamagingItemMixin, DamagingItemDataSchema } from './mixins/damaging';
import { ModalityItemMixin, ModalityItemDataSchema } from './mixins/modality';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';
import {
    LinkedSkillsMixin,
    LinkedSkillsItemDataSchema,
} from './mixins/linked-skills';

export type TalentItemDataSchema = IdItemDataSchema &
    TypedItemDataSchema<Talent.Type> &
    DescriptionItemDataSchema &
    ActivatableItemDataSchema &
    DamagingItemDataSchema &
    ModalityItemDataSchema &
    EventsItemDataSchema &
    LinkedSkillsItemDataSchema &
    RelationshipsItemDataSchema;

export class TalentItemDataModel extends DataModelMixin<TalentItemDataSchema>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: Talent.Type.Path,
        choices: () =>
            Object.entries(CONFIG.COSMERE.items.talent.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<Talent.Type, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Talent.desc_placeholder',
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    ModalityItemMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {}
