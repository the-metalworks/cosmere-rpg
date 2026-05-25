import { Talent } from '@system/types/item';
import { CosmereItem } from '@system/documents';
import type { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import type { IdItemDataSchema } from './mixins/id';
import { IdItemMixin } from './mixins/id';
import type {
    TypedItemDataSchema,
    TypedItemDerivedData} from './mixins/typed';
import {
    TypedItemMixin
} from './mixins/typed';
import type {
    DescriptionItemDataSchema} from './mixins/description';
import {
    DescriptionItemMixin
} from './mixins/description';
import { ResourcesItemMixin } from './mixins/resources';
import type { ModalityItemDataSchema } from './mixins/modality';
import { ModalityItemMixin } from './mixins/modality';
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
} from './mixins/relationships';

const SCHEMA = () => ({
    path: new foundry.data.fields.StringField({
        required: false,
        nullable: true,
        initial: null,
    }),
    ancestry: new foundry.data.fields.StringField({
        required: false,
        nullable: true,
        initial: null,
    }),
    power: new foundry.data.fields.StringField({
        required: false,
        nullable: true,
        initial: null,
        label: 'COSMERE.Item.Talent.Power.Label',
        hint: 'COSMERE.Item.Talent.Power.Hint',
    }),
});

export type TalentItemDataSchema = ReturnType<typeof SCHEMA> &
    IdItemDataSchema &
    TypedItemDataSchema<Talent.Type> &
    DescriptionItemDataSchema &
    ResourcesItemMixin.Schema &
    ModalityItemDataSchema &
    EventsItemDataSchema &
    RelationshipsItemDataSchema;

export type TalentItemDerivedData = TypedItemDerivedData & {
    hasPath: boolean;
    hasAncestry: boolean;
    hasPower: boolean;
};

export class TalentItemDataModel extends DataModelMixin<
    TalentItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    TalentItemDerivedData
>(
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
    ResourcesItemMixin(),
    ModalityItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        // Get item
        const item = this.parent as Item;

        // Get actor
        const actor = item.actor;

        if (this.path) {
            this.hasPath =
                actor?.items.some(
                    (item) => item.isPath() && item.id === this.path,
                ) ?? false;
        }

        if (this.ancestry) {
            this.hasAncestry =
                actor?.items.some(
                    (item) => item.isAncestry() && item.id === this.ancestry,
                ) ?? false;
        }

        if (this.power) {
            this.hasPower =
                actor?.items.some(
                    (item) => item.isPower() && item.id === this.power,
                ) ?? false;
        }
    }
}
