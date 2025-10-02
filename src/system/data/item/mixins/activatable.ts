import {
    ActivationType,
    ActionCostType,
    ItemConsumeType,
    ItemUseType,
    Resource,
    Skill,
    Attribute,
    ItemRechargeType,
} from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';
import { NumberRange, DeepMutable } from '@src/system/types/utils';

import { NONE } from '@system/types/utils';

const ACTIVATION_SCHEMA = () => ({
    type: new foundry.data.fields.StringField({
        required: true,
        blank: false,
        initial: ActivationType.None as ActivationType,
        choices: Object.entries(CONFIG.COSMERE.items.activation.types).reduce(
            (acc, [key, config]) => ({
                ...acc,
                [key]: config.label,
            }),
            {} as Record<ActivationType, string>,
        ),
        label: 'COSMERE.Item.Sheet.Activation.Type',
    }),
    cost: new foundry.data.fields.SchemaField(
        {
            value: new foundry.data.fields.NumberField({
                nullable: true,
                min: 0,
                max: 3,
                step: 1,
                integer: true,
            }),
            type: new foundry.data.fields.StringField({
                nullable: true,
                choices: {
                    none: 'GENERIC.None',
                    ...Object.entries(CONFIG.COSMERE.action.costs).reduce(
                        (acc, [key, config]) => ({
                            ...acc,
                            [key]: config.label,
                        }),
                        {} as Record<ActionCostType, string>,
                    ),
                },
                coerce: (value: unknown) => (value === '' ? null : value),
            }),
        },
        {
            required: true,
            label: 'COSMERE.Item.Sheet.Activation.Cost',
        },
    ),
    consume: new foundry.data.fields.ArrayField(
        new foundry.data.fields.SchemaField(
            {
                type: new foundry.data.fields.StringField({
                    required: true,
                    nullable: false,
                    choices: {
                        [NONE]: 'GENERIC.None',
                        ...Object.entries(
                            CONFIG.COSMERE.items.activation.consumeTypes,
                        ).reduce(
                            (acc, [key, config]) => ({
                                ...acc,
                                [key]: config.label,
                            }),
                            {} as Record<ItemConsumeType, string>,
                        ),
                    },
                    initial: ItemConsumeType.Resource,
                }),
                value: new foundry.data.fields.SchemaField({
                    min: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        min: 0,
                        integer: true,
                        initial: 0,
                    }),
                    max: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        min: -1,
                        integer: true,
                        initial: 0,
                    }),
                    actual: new foundry.data.fields.NumberField({
                        required: false,
                        nullable: false,
                        min: 0,
                        integer: true,
                        initial: 0,
                    }),
                }),
                resource: new foundry.data.fields.StringField({
                    blank: false,
                    choices: Object.entries(CONFIG.COSMERE.resources).reduce(
                        (acc, [key, config]) => ({
                            ...acc,
                            [key]: config.label,
                        }),
                        {} as Record<Resource, string>,
                    ),
                    initial: Resource.Focus,
                }),
            },
            {
                required: true,
                nullable: false,
            },
        ),
        {
            label: 'COSMERE.Item.Sheet.Activation.Consume',
        },
    ),
    flavor: new foundry.data.fields.HTMLField(),
    skill: new foundry.data.fields.StringField({
        nullable: true,
        choices: {
            none: 'GENERIC.None',
            ...Object.entries(CONFIG.COSMERE.skills).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<Skill, string>,
            ),
        },
        coerce: (value: unknown) => (value === '' ? null : value),
        label: 'GENERIC.Skill',
    }),
    attribute: new foundry.data.fields.StringField({
        nullable: true,
        initial: 'default',
        choices: {
            none: 'GENERIC.None',
            default: 'GENERIC.Default',
            ...Object.entries(CONFIG.COSMERE.attributes).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<Attribute, string>,
            ),
        },
        coerce: (value: unknown) => (value === '' ? null : value),
        label: 'GENERIC.Attribute',
    }),
    modifierFormula: new foundry.data.fields.StringField({
        nullable: true,
        blank: true,
        label: 'COSMERE.Item.Sheet.Activation.AdditionalFormula',
        hint: 'COSMERE.Item.Sheet.Activation.AdditionalFormulaDescription',
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
    uses: new foundry.data.fields.SchemaField(
        {
            type: new foundry.data.fields.StringField({
                required: true,
                initial: ItemUseType.Use,
                blank: false,
                choices: Object.entries(
                    CONFIG.COSMERE.items.activation.uses.types,
                ).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {} as Record<ItemUseType, string>,
                ),
            }),
            value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                min: 0,
                initial: 1,
                integer: true,
            }),
            max: new foundry.data.fields.NumberField({
                required: true,
                min: 1,
                initial: 1,
                integer: true,
            }),
            recharge: new foundry.data.fields.StringField({
                nullable: true,
                initial: null,
                choices: {
                    none: 'GENERIC.None',
                    ...Object.entries(
                        CONFIG.COSMERE.items.activation.uses.recharge,
                    ).reduce(
                        (acc, [key, config]) => ({
                            ...acc,
                            [key]: config.label,
                        }),
                        {} as Record<ItemRechargeType, string>,
                    ),
                },
                coerce: (value: unknown) => (value === '' ? null : value),
                label: 'COSMERE.Item.Sheet.Activation.Recharge',
            }),
        },
        {
            required: false,
            nullable: true,
            initial: null,
            label: 'COSMERE.Item.Sheet.Activation.Uses',
        },
    ),
});

type ActivationDataSchema = ReturnType<typeof ACTIVATION_SCHEMA>;
type DynamicActivationDataSchema = ReturnType<
    ReturnType<typeof getActivationDataModelCls>['defineSchema']
>;

// NOTE: Have to explicitly use a type here instead of an interface to comply with DataSchema type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActivatableItemDataSchema = {
    activation: ActivationField;
};
export type ActivatableItemData =
    foundry.data.fields.SchemaField.InitializedData<ActivatableItemDataSchema>;
export type ItemConsumeData =
    ActivatableItemData['activation']['consume'][number];

interface ActivatableItemMixinOptions {
    type?: {
        initial?: ActivationType;
    };

    skill?: {
        /**
         * Whether a the skill can be set to default or not.
         * If true, the skill can be set to 'default' and the `defaultSkillResolver` must be provided.
         */
        allowDefault?: boolean;

        /**
         * The initial value of the skill for the activation.
         */
        initial?: Skill | null | 'default';
    } & (
        | {
              allowDefault?: false;
              initial?: Skill | null; // If allowDefault is false, initial can only be a Skill or null
          }
        | {
              allowDefault: true;

              /**
               * Resolver function to determine the skill for the activation if the skill is set to 'Default'.
               */
              defaultResolver: () => Skill | null;
          }
    );
}

export function ActivatableItemMixin<
    TParent extends foundry.abstract.Document.Any,
>(options?: ActivatableItemMixinOptions) {
    if (options?.skill?.allowDefault && !options.skill.defaultResolver) {
        throw new Error(
            'ActivatableItemMixin: If allowDefaultSkill is true, defaultSkillResolver must be provided.',
        );
    }

    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class mixin extends base<ActivatableItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    activation: new ActivationField({
                        required: true,
                        ...options,
                    } as ActivationFieldOptions),
                });
            }

            public prepareDerivedData() {
                super.prepareDerivedData();

                // Ensure that the uses value is within the min/max bounds
                if (this.activation.uses) {
                    if (this.activation.uses.max != null) {
                        this.activation.uses.value = Math.max(
                            0,
                            Math.min(
                                this.activation.uses.max,
                                this.activation.uses.value,
                            ),
                        );
                    }
                }
            }
        };
    };
}

interface ActivationFieldOptions
    extends foundry.data.fields.SchemaField
            .Options<DynamicActivationDataSchema>,
        ActivatableItemMixinOptions {}

class ActivationField extends foundry.data.fields.SchemaField<
    DynamicActivationDataSchema,
    ActivationFieldOptions,
    | foundry.data.fields.SchemaField.AssignmentData<DynamicActivationDataSchema>
    | null
    | undefined,
    Activation<DynamicActivationDataSchema>
> {
    public readonly model: typeof Activation<DynamicActivationDataSchema>;

    constructor(
        options?: ActivationFieldOptions,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        // Get the activation data model class based on the options provided
        const cls = getActivationDataModelCls(options);

        // Call the parent constructor with the defined schema and options
        super(cls.defineSchema(), options, context);

        // Assign the model class
        this.model = cls;
    }

    protected override _cast(value: unknown) {
        return value && typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: foundry.data.fields.SchemaField.Internal.PersistedType<DynamicActivationDataSchema>,
        model: foundry.abstract.DataModel.Any,
        options?: foundry.data.fields.DataField.InitializeOptions,
    ) {
        return new this.model(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}

type FieldOptions<
    T extends
        foundry.data.fields.DataField<foundry.data.fields.DataField.Options.Any>,
> = T extends foundry.data.fields.DataField<infer U> ? U : never;

type BaseActivationDataSchema = Omit<ActivationDataSchema, 'skill'> & {
    skill: foundry.data.fields.StringField<
        Omit<FieldOptions<ActivationDataSchema['skill']>, 'initial' | 'choices'>
    >;
};

export class Activation<Schema extends BaseActivationDataSchema> extends foundry
    .abstract.DataModel<Schema, foundry.abstract.DataModel.Any> {
    static defineSchema(): foundry.data.fields.DataSchema {
        return ACTIVATION_SCHEMA();
    }

    /* --- Accessors --- */

    /**
     * Returns the resolved skill for the activation.
     * Cleans the configured value to return a valid skill id or null.
     */
    public get resolvedSkill(): Skill | null {
        // If no skill is configured, return null
        if (!this.skill || this.skill === 'none') return null;

        // If the skill is configured, check if it is a valid skill
        if (!(this.skill in CONFIG.COSMERE.skills)) return null;

        // Return the skill id
        return this.skill as Skill;
    }

    /**
     * Returns the resolved attribute for the activation.
     * Cleans the configured value to return a valid attribute or null.
     */
    public get resolvedAttribute(): Attribute | null {
        if (!this.attribute) return null;

        // Get the resolved skill
        const skillId = this.resolvedSkill;
        if (!skillId) return null; // If no skill is configured, never return an attribute

        switch (this.attribute) {
            case 'default':
                // If the attribute is 'default', return the default attribute for the skill
                return CONFIG.COSMERE.skills[skillId].attribute;
            case 'none':
                // If the attribute is 'none', return null
                return null;
            default:
                // Ensure that the attribute is a valid attribute
                if (!(this.attribute in CONFIG.COSMERE.attributes)) return null;

                // Return the attribute id
                return this.attribute;
        }
    }
}

function getActivationDataModelCls(options?: ActivatableItemMixinOptions) {
    function _defineSchema() {
        const baseSchema = Activation.defineSchema() as ActivationDataSchema;

        return {
            ...baseSchema,

            ...(options?.type?.initial
                ? {
                      type: new foundry.data.fields.StringField({
                          ...baseSchema.type.options,
                          initial: options.type.initial,
                      }),
                  }
                : {}),

            ...(options?.skill?.initial
                ? {
                      skill: new foundry.data.fields.StringField({
                          ...baseSchema.skill.options,
                          initial: options.skill.initial,
                      }),
                  }
                : {}),

            ...(options?.skill?.allowDefault
                ? {
                      skill: new foundry.data.fields.StringField({
                          ...baseSchema.skill.options,
                          choices: Object.fromEntries([
                              ['none', 'GENERIC.None'],
                              ['default', 'GENERIC.Default'],
                              ...Object.entries(
                                  baseSchema.skill.options.choices,
                              ).slice(1),
                          ]),
                      }),
                  }
                : {}),
        };
    }

    return class extends Activation<ReturnType<typeof _defineSchema>> {
        static defineSchema() {
            return _defineSchema();
        }

        /* --- Accessors --- */

        public override get resolvedSkill(): Skill | null {
            if (options?.skill?.allowDefault && this.skill === 'default') {
                // If the skill is set to 'default', use the default resolver
                return options.skill.defaultResolver.call(this.parent) ?? null;
            } else {
                // Otherwise, use the base implementation
                return super.resolvedSkill;
            }
        }
    };
}
