import type { Skill, Attribute } from '@system/types/cosmere';
import { NONE } from '@system/types/utils';

// Documents
import { CosmereItem } from '@system/documents';

// Fields
import { SkillField } from '@system/data/fields/skill-field';
import { AttributeField } from '@system/data/fields/attribute-field';

function defineDataModelSchema() {
    return {
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
        modifierFormula: new foundry.data.fields.StringField({
            nullable: true,
            blank: true,
            label: 'COSMERE.Item.Sheet.Activation.AdditionalFormula',
        }),
        plotDie: new foundry.data.fields.BooleanField({
            nullable: true,
            initial: false,
            label: 'DICE.Plot.RaiseTheStakes',
        }),
        opportunity: new foundry.data.fields.NumberField({
            nullable: true,
            min: 1,
            max: 20,
            integer: true,
            label: 'COSMERE.Item.Activation.Opportunity',
        }),
        complication: new foundry.data.fields.NumberField({
            nullable: true,
            min: 1,
            max: 20,
            integer: true,
            label: 'COSMERE.Item.Activation.Complication',
        }),
    } as const;
}

export class SkillTestDataModel extends foundry.abstract.DataModel<
    SkillTestDataModel.Schema,
    foundry.abstract.DataModel.Any
> {
    public static defineSchema() {
        return defineDataModelSchema();
    }

    /* --- Accessors --- */

    public get resolvedSkill(): Skill | null {
        if (!this.skill || this.skill === NONE) return null;

        const action = this.item;

        if (this.skill === 'default') {
            if (
                !action?.parent ||
                !(action.parent instanceof CosmereItem) ||
                !action.parent.isWeapon()
            )
                return null;

            const weaponType = action.parent.system.type;
            const skill = CONFIG.COSMERE.items.weapon.types[weaponType]?.skill;

            return skill ?? null;
        } else {
            // Ensure the configured skill is valid
            if (!(this.skill in CONFIG.COSMERE.skills)) return null;

            return this.skill;
        }
    }

    public get resolvedAttribute(): Attribute | null {
        if (!this.attribute || this.attribute === NONE) return null;

        const skill = this.resolvedSkill;

        switch (this.attribute) {
            case 'default':
                if (!skill) return null;

                return CONFIG.COSMERE.skills[skill].attribute;
            default:
                // Ensure the configured attribute is valid
                if (!(this.attribute in CONFIG.COSMERE.attributes)) return null;

                return this.attribute;
        }
    }

    protected get item(): CosmereItem | null {
        let item: CosmereItem | null = null;
        let dataModel: foundry.abstract.DataModel.Any = this.parent;

        while (item === null) {
            if (dataModel instanceof CosmereItem) {
                item = dataModel;
            } else if (dataModel.parent) {
                dataModel = dataModel.parent as foundry.abstract.DataModel.Any;
            } else {
                return null;
            }
        }

        return item;
    }
}

export namespace SkillTestDataModel {
    export type Schema = ReturnType<typeof defineDataModelSchema>;

    export type InitializedData =
        foundry.data.fields.SchemaField.InitializedData<Schema>;
}

export class SkillTestField extends foundry.data.fields.SchemaField<
    SkillTestDataModel.Schema,
    SkillTestField.Options,
    foundry.data.fields.SchemaField.Internal.InitializedType<
        SkillTestDataModel.Schema,
        SkillTestField.Options
    >,
    SkillTestDataModel
> {
    constructor(
        options?: SkillTestField.Options,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(SkillTestDataModel.defineSchema(), options, context);
    }

    initialize(
        value: SkillTestDataModel.InitializedData,
        model: foundry.abstract.Document.Any,
        options?: object,
    ) {
        return new SkillTestDataModel(value, {
            parent: model,
            ...options,
        });
    }
}

export namespace SkillTestField {
    export type Options =
        foundry.data.fields.SchemaField.Options<SkillTestDataModel.Schema>;
}
