import type { Skill, PowerType } from '@system/types/cosmere';
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
import type { EventsItemDataSchema } from './mixins/events';
import { EventsItemMixin } from './mixins/events';
import type {
    RelationshipsItemDataSchema} from './mixins/relationships';
import {
    RelationshipsMixin
} from './mixins/relationships';
import type {
    TalentsProviderDataSchema} from './mixins/talents-provider';
import {
    TalentsProviderMixin,
} from './mixins/talents-provider';

const SCHEMA = () => ({
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
});

export type PowerItemDataSchema = ReturnType<typeof SCHEMA> &
    IdItemDataSchema &
    TypedItemDataSchema<PowerType> &
    DescriptionItemDataSchema &
    ResourcesItemMixin.Schema &
    EventsItemDataSchema &
    RelationshipsItemDataSchema &
    TalentsProviderDataSchema;

export type PowerItemDerivedData = TypedItemDerivedData;

export type PowerItemCreateData = Item.CreateData & {
    system: foundry.data.fields.SchemaField.CreateData<PowerItemDataSchema>;
};

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
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Power.desc_placeholder',
    }),
    ResourcesItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
    TalentsProviderMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        if (!this.customSkill) {
            const validId = this.id in CONFIG.COSMERE.skills;
            this.skill = validId ? (this.id as Skill) : null;
        }
    }
}
