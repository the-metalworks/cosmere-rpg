import type { DamageType, Skill, Attribute } from '@system/types/cosmere';
import { NONE } from '@system/types/utils';

import { ActionItemDataModel } from '../index';

// Fields
import { SkillField } from '@system/data/fields/skill-field';
import { AttributeField } from '@system/data/fields/attribute-field';

function defineDataModelSchema() {
    return {
        formula: new foundry.data.fields.StringField({
            nullable: true,
            blank: false,
        }),
        grazeOverrideFormula: new foundry.data.fields.StringField({
            nullable: true,
        }),
        type: new foundry.data.fields.StringField({
            nullable: true,
            choices: Object.keys(CONFIG.COSMERE.damageTypes) as DamageType[],
        }),
        skill: new SkillField({
            nullable: true,
            noneable: true,
            includeDefault: true,
            initial: 'default',
        }),
        attribute: new AttributeField({
            nullable: true,
            noneable: true,
            includeDefault: true,
            initial: 'default',
        }),
    };
}

export class DamageDataModel extends foundry.abstract.DataModel<
    DamageDataModel.Schema,
    foundry.abstract.DataModel<ActionItemDataModel.Schema>
> {
    public static defineSchema() {
        return defineDataModelSchema();
    }

    /* --- Accessors --- */

    public get resolvedSkill(): Skill | null {
        if (!this.skill || this.skill === NONE) return null;

        if (this.skill === 'default') {
            return this.parent?.skillTest?.resolvedSkill ?? null;
        } else {
            return this.skill;
        }
    }

    public get resolvedAttribute(): Attribute | null {
        if (!this.attribute || this.attribute === NONE) return null;

        if (this.attribute === 'default') {
            return this.parent?.skillTest?.resolvedAttribute ?? null;
        } else {
            return this.attribute;
        }
    }
}

export namespace DamageDataModel {
    export type Schema = ReturnType<typeof defineDataModelSchema>;

    export type InitializedData =
        foundry.data.fields.SchemaField.InitializedData<Schema>;
}

export class DamageField extends foundry.data.fields.SchemaField<
    DamageDataModel.Schema,
    DamageField.Options,
    foundry.data.fields.SchemaField.Internal.InitializedType<
        DamageDataModel.Schema,
        DamageField.Options
    >,
    DamageDataModel
> {
    constructor(
        options?: DamageField.Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(DamageDataModel.defineSchema(), options, context);
    }

    initialize(
        value: DamageDataModel.InitializedData,
        model: foundry.abstract.DataModel<ActionItemDataModel.Schema>,
        options?: object,
    ) {
        return new DamageDataModel(value, {
            parent: model,
            ...options,
        });
    }
}

export namespace DamageField {
    export type Options =
        foundry.data.fields.SchemaField.Options<DamageDataModel.Schema>;
}
