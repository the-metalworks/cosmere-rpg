import { Skill, PowerType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';
import { EmptyObject } from '@system/types/utils';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
import { TypedItemMixin, TypedItemDataSchema, TypedItemDerivedData } from './mixins/typed';
import {
    ActivatableItemDataSchema,
    ActivatableItemMixin,
} from './mixins/activatable';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from './mixins/description';
import { DamagingItemDataSchema, DamagingItemMixin } from './mixins/damaging';
import { EventsItemMixin, EventsItemDataSchema } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from './mixins/relationships';

const SCHEMA = {
    customSkill: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
        label: 'COSMERE.Item.Power.CustomSkill.Label',
        hint: 'COSMERE.Item.Power.CustomSkill.Hint',
    }),

    skill: new foundry.data.fields.StringField({
        required: true,
        nullable: true,
        blank: false,
        label: 'COSMERE.Item.Power.Skill.Label',
        hint: 'COSMERE.Item.Power.Skill.Hint',
        initial: null,
        choices: () =>
            Object.entries(CONFIG.COSMERE.skills)
                .filter(([key, skill]) => !skill.core)
                .reduce(
                    (acc, [key, skill]) => ({
                        ...acc,
                        [key]: skill.label,
                    }),
                    {} as Record<Skill, string>,
                ),
    }),
}

export type PowerItemDataSchema = 
    & typeof SCHEMA
    & IdItemDataSchema
    & TypedItemDataSchema<PowerType>
    & DamagingItemDataSchema
    & DescriptionItemDataSchema
    & ActivatableItemDataSchema
    & EventsItemDataSchema
    & RelationshipsItemDataSchema;

export type PowerItemDerivedData = TypedItemDerivedData;

export class PowerItemDataModel extends DataModelMixin<
    PowerItemDataSchema,
    foundry.abstract.Document.Any,
    EmptyObject,
    PowerItemDerivedData
>(
    IdItemMixin({
        initialFromName: true,
        hint: 'COSMERE.Item.Power.Identifier.Hint',
    }),
    TypedItemMixin({
        initial: () => Object.keys(CONFIG.COSMERE.power.types)[0],
        choices: () =>
            Object.entries(CONFIG.COSMERE.power.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Power.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        if (!this.customSkill) {
            const validId = this.id in CONFIG.COSMERE.skills;
            this.skill = validId ? (this.id as Skill) : null;
        }
    }
}
