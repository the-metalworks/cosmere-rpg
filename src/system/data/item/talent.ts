import { Talent } from '@system/types/item';
import { CosmereItem } from '@system/documents';
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

const SCHEMA = {
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
};

export type TalentItemDataSchema = 
    & typeof SCHEMA
    & IdItemDataSchema
    & TypedItemDataSchema<Talent.Type>
    & DescriptionItemDataSchema
    & ActivatableItemDataSchema
    & DamagingItemDataSchema
    & ModalityItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export type TalentItemDerivedData = TypedItemDerivedData & {
    hasPath: boolean;
    hasAncestry: boolean;
    hasPower: boolean;
}

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
    ActivatableItemMixin(),
    DamagingItemMixin(),
    ModalityItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), );
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
