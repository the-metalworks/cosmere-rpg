// import { ActionType } from '@system/types/cosmere';
// import { EmptyObject } from '@system/types/utils';

// Fields
import { ActivationField } from './fields/activation';
import { DamageField } from './fields/damage';
import { SkillTestField } from './fields/skill-test';

// Mixins
import { DataModelMixin } from '../../mixins';
import type { IdItemDataSchema } from '../mixins/id';
import { IdItemMixin } from '../mixins/id';
// import {
//     TypedItemMixin,
//     TypedItemDataSchema,
//     TypedItemDerivedData,
// } from '../mixins/typed';
import type {
    DescriptionItemDataSchema} from '../mixins/description';
import {
    DescriptionItemMixin
} from '../mixins/description';
import { ResourcesItemMixin } from '../mixins/resources';
import type { ModalityItemDataSchema } from '../mixins/modality';
import { ModalityItemMixin } from '../mixins/modality';
import type { EventsItemDataSchema } from '../mixins/events';
import { EventsItemMixin } from '../mixins/events';
import type {
    RelationshipsItemDataSchema} from '../mixins/relationships';
import {
    RelationshipsMixin
} from '../mixins/relationships';

const SCHEMA = () => ({
    activation: new ActivationField({
        required: true,
        nullable: false,
    }),
    damage: new DamageField(),
    skillTest: new SkillTestField(),
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
