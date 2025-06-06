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
import { NumberRange } from '@src/system/types/utils';

import { NONE } from '@system/types/utils';

// Fields
import { StringField } from '@system/data/fields/string-field';

export interface ItemConsumeData {
    type: ItemConsumeType;
    value: NumberRange;
    resource?: Resource;
}

export interface ActivatableItemData {
    activation: Activation;
}

interface ActivationData {
    type: ActivationType;
    cost: {
        value?: number;
        type?: ActionCostType;
    };
    consume?: ItemConsumeData[];
    uses?: {
        type: ItemUseType;
        value: number;
        max: number;
        recharge?: ItemRechargeType;
    };

    flavor?: string;

    /* -- Skill test activation -- */
    skill?: Skill | 'none' | 'default';
    attribute?: Attribute | 'none' | 'default';
    modifierFormula?: string;
    plotDie?: boolean;

    /**
     * The value of d20 result which represents an opportunity
     */
    opportunity?: number;

    /**
     * The value of d20 result which represent an complication
     */
    complication?: number;
}

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

export function ActivatableItemMixin<P extends CosmereItem>(
    options?: ActivatableItemMixinOptions,
) {
    if (options?.skill?.allowDefault && !options.skill.defaultResolver) {
        throw new Error(
            'ActivatableItemMixin: If allowDefaultSkill is true, defaultSkillResolver must be provided.',
        );
    }

    return (
        base: typeof foundry.abstract.TypeDataModel<ActivatableItemData, P>,
    ) => {
        return class mixin extends base {
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
    extends foundry.data.fields.DataFieldOptions,
        ActivatableItemMixinOptions {}

class ActivationField extends foundry.data.fields.SchemaField {
    public readonly model: typeof Activation;

    constructor(
        options?: ActivationFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        // Get the activation data model class based on the options provided
        const cls = getActivationDataModelCls(options);

        // Call the parent constructor with the defined schema and options
        super(cls.defineSchema(), options, context);

        // Assign the model class
        this.model = cls;
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: unknown,
        model: object,
        options?: object,
    ) {
        return new this.model(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}

export class Activation extends foundry.abstract.DataModel<ActivationData> {
    static defineSchema(): foundry.data.fields.DataSchema {
        return {
            type: new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: ActivationType.None,
                choices: Object.entries(
                    CONFIG.COSMERE.items.activation.types,
                ).reduce(
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
                    type: new StringField({
                        nullable: true,
                        choices: {
                            '': 'GENERIC.None',
                            ...Object.entries(
                                CONFIG.COSMERE.action.costs,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {} as Record<ActionCostType, string>,
                            ),
                        },
                        coerce: (value: unknown) =>
                            value === '' ? null : value,
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
                        type: new StringField({
                            required: true,
                            nullable: false,
                            choices: {
                                [NONE]: 'GENERIC.None',
                                ...Object.entries(
                                    CONFIG.COSMERE.items.activation
                                        .consumeTypes,
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
                            choices: Object.entries(
                                CONFIG.COSMERE.resources,
                            ).reduce(
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
                        required: false,
                        nullable: true,
                        initial: null,
                    },
                ),
                {
                    label: 'COSMERE.Item.Sheet.Activation.Consume',
                },
            ),
            flavor: new foundry.data.fields.HTMLField(),
            skill: new StringField({
                nullable: true,
                choices: {
                    '': 'GENERIC.None',
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
            attribute: new StringField({
                nullable: true,
                initial: 'default',
                choices: {
                    '': 'GENERIC.None',
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
                    type: new StringField({
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
                    recharge: new StringField({
                        nullable: true,
                        initial: null,
                        choices: {
                            '': 'GENERIC.None',
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
                        coerce: (value: unknown) =>
                            value === '' ? null : value,
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
        };
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
    return class extends Activation {
        static defineSchema() {
            const schema = super.defineSchema();

            if (options?.type?.initial) {
                schema.type.options.initial = options.type.initial;
                schema.type.initial = options.type.initial;
            }

            if (options?.skill?.initial) {
                schema.skill.options.initial = options.skill.initial;
                schema.skill.initial = options.skill.initial;
            }

            if (options?.skill?.allowDefault) {
                (schema.skill as StringField).options.choices = [
                    ['', 'GENERIC.None'],
                    ['default', 'GENERIC.Default'],
                    ...Object.entries(
                        foundry.utils.getProperty(
                            schema,
                            'skill.options.choices',
                        ),
                    ).filter(([key]) => key !== ''),
                ].reduce(
                    (acc, [key, label]) => ({
                        ...acc,
                        [key]: label,
                    }),
                    {},
                );
                (schema.skill as StringField).choices = (
                    schema.skill as StringField
                ).options.choices as object | string[];
            }

            return schema;
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
