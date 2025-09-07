import { Size, CreatureType } from '@system/types/cosmere';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemDataSchema } from './mixins/id';
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

const SCHEMA = () => ({
    size: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: Size.Medium,
        choices: Object.entries(CONFIG.COSMERE.sizes).reduce(
            (acc, [key, config]) => ({
                ...acc,
                [key]: config.label,
            }),
            {},
        ),
    }),
    type: new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            initial: CreatureType.Humanoid,
            choices: Object.entries(
                CONFIG.COSMERE.creatureTypes,
            ).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
        }),
        custom: new foundry.data.fields.StringField({ nullable: true }),
        subtype: new foundry.data.fields.StringField({
            nullable: true,
        }),
    }),
    advancement: new foundry.data.fields.SchemaField({
        extraPath: new foundry.data.fields.DocumentUUIDField({
            type: 'Item',
        }),
        extraTalents: new foundry.data.fields.ArrayField(
            new foundry.data.fields.SchemaField({
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Item',
                    nullable: false,
                }),
                level: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                }),
            }),
        ),

        bonusTalents: new foundry.data.fields.ArrayField(
            new foundry.data.fields.SchemaField({
                level: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0,
                }),
                quantity: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0,
                }),
                restrictions: new foundry.data.fields.StringField(),
            }),
        ),
    }),
});

type AncestryItemDataSchema = 
    & ReturnType<typeof SCHEMA>
    & IdItemDataSchema
    & DescriptionItemDataSchema
    & TalentsProviderDataSchema
    & EventsItemDataSchema
    & LinkedSkillsItemDataSchema
    & RelationshipsItemDataSchema;

export type AncestryItemData = foundry.data.fields.SchemaField.InitializedData<AncestryItemDataSchema>;
export type BonusTalentsRule = AncestryItemData['advancement']['bonusTalents'][number];

export class AncestryItemDataModel extends DataModelMixin<
    AncestryItemDataSchema
>(
    IdItemMixin({
        initial: 'none',
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Ancestry.desc_placeholder',
    }),
    TalentsProviderMixin(),
    EventsItemMixin(),
    LinkedSkillsMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }

    get typeFieldId() {
        return this.schema.fields.type.fields.id;
    }

    get sizeField() {
        return this.schema.fields.size;
    }

    get extraTalents() {
        return this.advancement.extraTalents;
    }
}
