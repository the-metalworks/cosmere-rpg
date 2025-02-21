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

interface ItemResourceData {
    value: number;
    max?: number;
    recharge?: ItemRechargeType;
}

export interface ActivatableItemData {
    activation: {
        type: ActivationType;
        cost: {
            value?: number;
            type?: ActionCostType;
        };
        consume?: {
            type: ItemConsumeType;
            value: number;
            resource?: Resource;
        };
        uses?: {
            type: ItemUseType;
            value: number;
            max: number;
            recharge?: ItemRechargeType;
        };

        flavor?: string;

        /* -- Skill test activation -- */
        skill?: Skill;
        attribute?: Attribute;
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
    };
}

export function ActivatableItemMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<ActivatableItemData, P>,
    ) => {
        return class mixin extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    activation: new foundry.data.fields.SchemaField({
                        type: new foundry.data.fields.StringField({
                            required: true,
                            blank: false,
                            initial: ActivationType.None,
                            choices: Object.keys(
                                CONFIG.COSMERE.items.activation.types,
                            ),
                        }),
                        cost: new foundry.data.fields.SchemaField(
                            {
                                value: new foundry.data.fields.NumberField({
                                    nullable: true,
                                    min: 0,
                                    integer: true,
                                }),
                                type: new foundry.data.fields.StringField({
                                    nullable: true,
                                    blank: false,
                                    choices: Object.keys(
                                        CONFIG.COSMERE.action.costs,
                                    ),
                                }),
                            },
                            {
                                required: true,
                            },
                        ),
                        consume: new foundry.data.fields.SchemaField(
                            {
                                type: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                    choices: Object.keys(
                                        CONFIG.COSMERE.items.activation
                                            .consumeTypes,
                                    ),
                                    initial: ItemConsumeType.Resource,
                                }),
                                value: new foundry.data.fields.NumberField({
                                    required: true,
                                    nullable: false,
                                    min: 0,
                                    integer: true,
                                    initial: 0,
                                }),
                                resource: new foundry.data.fields.StringField({
                                    blank: false,
                                    choices: [
                                        ...Object.keys(
                                            CONFIG.COSMERE.resources,
                                        ),
                                    ],
                                    initial: Resource.Focus,
                                }),
                            },
                            {
                                required: false,
                                nullable: true,
                                initial: null,
                            },
                        ),
                        flavor: new foundry.data.fields.HTMLField(),
                        skill: new foundry.data.fields.StringField({
                            nullable: true,
                            blank: false,
                            choices: Object.keys(CONFIG.COSMERE.skills),
                        }),
                        attribute: new foundry.data.fields.StringField({
                            nullable: true,
                            blank: false,
                            choices: Object.keys(CONFIG.COSMERE.attributes),
                        }),
                        modifierFormula: new foundry.data.fields.StringField({
                            nullable: true,
                            blank: true,
                        }),
                        plotDie: new foundry.data.fields.BooleanField({
                            nullable: true,
                            initial: false,
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
                                    blank: false,
                                    initial: ItemUseType.Use,
                                    choices: Object.entries(
                                        CONFIG.COSMERE.items.activation.uses
                                            .types,
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
                                    blank: false,
                                    initial: null,
                                    choices: Object.entries(
                                        CONFIG.COSMERE.items.activation.uses
                                            .recharge,
                                    ).reduce(
                                        (acc, [key, config]) => ({
                                            ...acc,
                                            [key]: config.label,
                                        }),
                                        {} as Record<ItemRechargeType, string>,
                                    ),
                                }),
                            },
                            {
                                required: false,
                                nullable: true,
                                initial: null,
                            },
                        ),
                    }),
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
