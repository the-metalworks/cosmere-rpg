// import { ActionType } from '@system/types/cosmere';
// import { EmptyObject } from '@system/types/utils';

// Fields
import { ActivationField } from './fields/activation';
import { DamageField } from './fields/damage';
import { SkillTestField } from './fields/skill-test';

// Mixins
import { DataModelMixin } from '../../mixins';
import { IdItemMixin, IdItemDataSchema } from '../mixins/id';
// import {
//     TypedItemMixin,
//     TypedItemDataSchema,
//     TypedItemDerivedData,
// } from '../mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemDataSchema,
} from '../mixins/description';
import { ResourcesItemMixin } from '../mixins/resources';
import { ModalityItemMixin, ModalityItemDataSchema } from '../mixins/modality';
import { EventsItemMixin, EventsItemDataSchema } from '../mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemDataSchema,
} from '../mixins/relationships';
import { ActionVisibilityFilterType } from '@src/system/types/cosmere';

const FILTER_TYPE_SCHEMA = (type: ActionVisibilityFilterType) => ({
    active: new foundry.data.fields.BooleanField({
        required: true,
        nullable: false,
        initial: CONFIG.COSMERE.action.visibility[type].defaultEnabled ?? false,
    }),
});

const SCHEMA = () => ({
    activation: new ActivationField({
        required: true,
        nullable: false,
    }),
    damage: new DamageField(),
    skillTest: new SkillTestField(),
    visibilityFilters: new foundry.data.fields.SchemaField(
        Object.keys(CONFIG.COSMERE.action.visibility).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: new foundry.data.fields.SchemaField(
                    FILTER_TYPE_SCHEMA(key as ActionVisibilityFilterType),
                ),
            }),
            {} as Record<
                ActionVisibilityFilterType,
                foundry.data.fields.SchemaField<
                    ReturnType<typeof FILTER_TYPE_SCHEMA>
                >
            >,
        ),
    ),
});

export class ActionItemDataModel extends DataModelMixin<ActionItemDataModel.Schema>(
    // foundry.abstract.Document.Any,
    // EmptyObject,
    // ActionItemDataModel.DerivedData
    IdItemMixin({
        initialFromName: true,
    }),
    // TypedItemMixin({
    //     initial: ActionType.Basic,
    //     choices: () =>
    //         Object.entries(CONFIG.COSMERE.action.types).reduce(
    //             (acc, [key, config]) => ({
    //                 ...acc,
    //                 [key]: config.label,
    //             }),
    //             {} as Record<ActionType, string>,
    //         ),
    // }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Action.desc_placeholder',
    }),
    ResourcesItemMixin(),
    ModalityItemMixin(),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }
}

export namespace ActionItemDataModel {
    export type Schema = ReturnType<typeof SCHEMA> &
        IdItemDataSchema &
        // & TypedItemDataSchema<ActionType>
        DescriptionItemDataSchema &
        ResourcesItemMixin.Schema &
        ModalityItemDataSchema &
        EventsItemDataSchema &
        RelationshipsItemDataSchema;

    export type InitializedData =
        foundry.data.fields.SchemaField.InitializedData<Schema>;

    // export type DerivedData = TypedItemDerivedData;

    export type ConsumeData =
        ActivationField.InitializedData['consumption'][number];
}
