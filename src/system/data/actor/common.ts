import {
    Size,
    CreatureType,
    Attribute,
    Resource,
    AttributeGroup,
    Skill,
    ExpertiseType,
    DeflectSource,
    ItemType,
    DamageType,
    Condition,
} from '@system/types/cosmere';
import { CosmereActor } from '@system/documents/actor';
import { CosmereItem } from '@system/documents';
import { ArmorItemDataModel } from '@system/data/item/armor';

// Fields
import { DerivedValueField, Derived } from '../fields/derived-value-field';

interface DeflectData extends Derived<number> {
    source?: DeflectSource;
}

export interface ExpertiseData {
    type: ExpertiseType;
    id: string;
    label: string;
    custom?: boolean;
    locked?: boolean;
}

interface CurrencyDenominationData {
    id: string;
    secondaryId?: string; // Optional secondary id for doubly-denominated currencies, like spheres
    amount: number;

    /*
     * Conversion rate is a comparison to the "base" denomination of a currency.
     * This value is derived from either the primary denomination's conversion rate,
     * or the product of the primary and secondary denominations' rates, if the secondary is present.
     *
     * Converted value is simply (amount * conversionRate).
     * We want the total value expressed in the base denomination.
     */
    conversionRate: Derived<number>;
    convertedValue: Derived<number>;
}

export interface CommonActorData {
    size: Size;
    type: {
        id: CreatureType;
        custom?: string | null;
        subtype?: string | null;
    };
    tier: number;
    senses: {
        range: Derived<number>;
    };
    immunities: {
        damage: DamageType[];
        condition: Condition[];
    };
    attributes: Record<Attribute, { value: number; bonus: number }>;
    defenses: Record<AttributeGroup, { value: Derived<number>; bonus: number }>;
    deflect: DeflectData;
    resources: Record<
        Resource,
        {
            value: number;
            max: Derived<number>;
        }
    >;
    skills: Record<
        Skill,
        { attribute: Attribute; rank: number; mod: Derived<number> }
    >;
    injuries: Derived<number>;
    injuryRollBonus: number;
    currency: Record<
        string,
        {
            denominations: CurrencyDenominationData[];
            total: Derived<number>;
        }
    >;
    movement: {
        rate: Derived<number>;
    };
    encumbrance: {
        lift: Derived<number>;
        carry: Derived<number>;
    };
    expertises?: ExpertiseData[];
    languages?: string[];
}

export class CommonActorDataModel<
    Schema extends CommonActorData = CommonActorData,
> extends foundry.abstract.TypeDataModel<Schema, CosmereActor> {
    static defineSchema() {
        return {
            size: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: Size.Medium,
                choices: Object.keys(CONFIG.COSMERE.sizes),
            }),
            type: new foundry.data.fields.SchemaField({
                id: new foundry.data.fields.StringField({
                    required: true,
                    nullable: false,
                    blank: false,
                    initial: CreatureType.Humanoid,
                    choices: Object.keys(CONFIG.COSMERE.creatureTypes),
                }),
                custom: new foundry.data.fields.StringField({ nullable: true }),
                subtype: new foundry.data.fields.StringField({
                    nullable: true,
                }),
            }),
            tier: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                min: 0,
                integer: true,
                initial: 1,
            }),
            senses: new foundry.data.fields.SchemaField({
                range: new DerivedValueField(
                    new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        min: 0,
                        initial: 5,
                    }),
                ),
                obscuredAffected: new foundry.data.fields.BooleanField({
                    required: true,
                    nullable: false,
                    initial: true,
                }),
            }),
            immunities: new foundry.data.fields.SchemaField({
                damage: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.StringField({
                        nullable: false,
                        blank: false,
                        choices: Object.keys(CONFIG.COSMERE.damageTypes),
                    }),
                ),
                conditions: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.StringField({
                        nullable: false,
                        blank: false,
                        choices: Object.keys(CONFIG.COSMERE.conditions),
                    }),
                ),
            }),
            attributes: this.getAttributesSchema(),
            defenses: this.getDefensesSchema(),
            resources: this.getResourcesSchema(),
            skills: this.getSkillsSchema(),
            currency: this.getCurrencySchema(),
            deflect: new DerivedValueField(
                new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0,
                }),
                {
                    additionalFields: {
                        source: new foundry.data.fields.StringField({
                            initial: DeflectSource.Armor,
                            choices: Object.keys(
                                CONFIG.COSMERE.deflect.sources,
                            ),
                        }),
                    },
                },
            ),
            movement: new foundry.data.fields.SchemaField({
                rate: new DerivedValueField(
                    new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        min: 0,
                        initial: 0,
                    }),
                ),
            }),
            injuries: new DerivedValueField(
                new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0,
                }),
            ),
            injuryRollBonus: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0,
            }),
            encumbrance: new foundry.data.fields.SchemaField({
                lift: new DerivedValueField(
                    new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        min: 0,
                        initial: 0,
                    }),
                ),
                carry: new DerivedValueField(
                    new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        min: 0,
                        initial: 0,
                    }),
                ),
            }),
            expertises: new foundry.data.fields.ArrayField(
                new foundry.data.fields.SchemaField({
                    type: new foundry.data.fields.StringField({
                        required: true,
                        nullable: false,
                        blank: false,
                        initial: ExpertiseType.Cultural,
                        choices: Object.keys(CONFIG.COSMERE.expertiseTypes),
                    }),
                    id: new foundry.data.fields.StringField({
                        required: true,
                        nullable: false,
                        blank: false,
                    }),
                    label: new foundry.data.fields.StringField({
                        required: true,
                        nullable: false,
                        blank: false,
                    }),
                    custom: new foundry.data.fields.BooleanField(),
                    locked: new foundry.data.fields.BooleanField(),
                }),
            ),
            languages: new foundry.data.fields.ArrayField(
                new foundry.data.fields.StringField(),
            ),
        };
    }

    private static getAttributesSchema() {
        const attributes = CONFIG.COSMERE.attributes;

        return new foundry.data.fields.SchemaField(
            Object.keys(attributes).reduce(
                (schemas, key) => {
                    schemas[key] = new foundry.data.fields.SchemaField({
                        value: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 10,
                            initial: 0,
                        }),
                        bonus: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0,
                        }),
                    });

                    return schemas;
                },
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    private static getDefensesSchema() {
        const defenses = CONFIG.COSMERE.attributeGroups;

        return new foundry.data.fields.SchemaField(
            Object.keys(defenses).reduce(
                (schemas, key) => {
                    schemas[key] = new foundry.data.fields.SchemaField({
                        value: new DerivedValueField(
                            new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                integer: true,
                                min: 0,
                                initial: 0,
                            }),
                        ),
                        bonus: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0,
                        }),
                    });

                    return schemas;
                },
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    private static getResourcesSchema() {
        const resources = CONFIG.COSMERE.resources;

        return new foundry.data.fields.SchemaField(
            Object.keys(resources).reduce(
                (schemas, key) => {
                    schemas[key] = new foundry.data.fields.SchemaField({
                        value: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0,
                        }),
                        max: new DerivedValueField(
                            new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                integer: true,
                                min: 0,
                                initial: 0,
                            }),
                        ),
                        bonus: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0,
                        }),
                    });

                    return schemas;
                },
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    private static getSkillsSchema() {
        const skills = CONFIG.COSMERE.skills;

        return new foundry.data.fields.SchemaField(
            (Object.keys(skills) as Skill[]).reduce(
                (schemas, key) => {
                    schemas[key] = new foundry.data.fields.SchemaField({
                        attribute: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                            initial: skills[key].attribute,
                        }),
                        rank: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 5,
                            initial: 0,
                        }),
                        mod: new DerivedValueField(
                            new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                integer: true,
                                min: 0,
                                initial: 0,
                            }),
                        ),
                    });

                    return schemas;
                },
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    private static getCurrencySchema() {
        const currencies = CONFIG.COSMERE.currencies;

        return new foundry.data.fields.SchemaField(
            Object.keys(currencies).reduce(
                (schemas, key) => {
                    schemas[key] = new foundry.data.fields.SchemaField({
                        denominations: new foundry.data.fields.ArrayField(
                            this.getCurrencyDenominationSchema(key),
                        ),
                        total: new DerivedValueField(
                            new foundry.data.fields.NumberField({
                                required: true,
                                nullable: false,
                                integer: false,
                                min: 0,
                                initial: 0,
                            }),
                        ),
                    });

                    return schemas;
                },
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    private static getCurrencyDenominationSchema(currency: string) {
        const denominations = CONFIG.COSMERE.currencies[currency].denominations;

        return new foundry.data.fields.SchemaField({
            id: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                choices: denominations.primary.map((d) => d.id),
            }),
            secondaryId: new foundry.data.fields.StringField({
                required: false,
                nullable: false,
                choices: denominations.secondary?.map((d) => d.id) ?? [],
            }),
            amount: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
            }),
            conversionRate: new DerivedValueField(
                new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: false, // Support subdenominations of the "base", e.g. 1 chip = 0.2 marks
                    min: 0,
                    initial: 0,
                }),
            ),
            convertedValue: new DerivedValueField(
                new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: false,
                    min: 0,
                    initial: 0,
                }),
            ),
        });
    }

    public prepareDerivedData(): void {
        super.prepareDerivedData();

        this.senses.range.value = awarenessToSensesRange(
            this.attributes.awa.value,
        );

        // Derive defenses
        (Object.keys(this.defenses) as AttributeGroup[]).forEach((group) => {
            // Get bonus
            const bonus = this.defenses[group].bonus;

            // Get attributes
            const attrs = CONFIG.COSMERE.attributeGroups[group].attributes;

            // Get attribute values
            const attrValues = attrs.map((key) => this.attributes[key].value);

            // Sum attribute values
            const attrsSum = attrValues.reduce((sum, v) => sum + v, 0);

            // Assign defense
            this.defenses[group].value.value = 10 + attrsSum + bonus;
        });

        // Derive resource max
        (Object.keys(this.resources) as Resource[]).forEach((key) => {
            // Get the resource
            const resource = this.resources[key];

            if (key === Resource.Health) {
                // Get strength value
                const strength = this.attributes.str.value;

                // Assign max
                resource.max.value = 10 + strength + (resource.max.bonus ?? 0);
            } else if (key === Resource.Focus) {
                // Get willpower value
                const willpower = this.attributes.wil.value;

                // Assign max
                resource.max.value = 2 + willpower + (resource.max.bonus ?? 0);
            }

            // Get max
            const max = Derived.getValue(resource.max)!;

            // Ensure resource value is between max mand min
            resource.value = Math.max(0, Math.min(max, resource.value));
        });

        // Derive skill modifiers
        (Object.keys(this.skills) as Skill[]).forEach((skill) => {
            // Get the skill config
            const skillConfig = CONFIG.COSMERE.skills[skill];

            // Get the attribute associated with this skill
            const attributeId = skillConfig.attribute;

            // Get attribute
            const attribute = this.attributes[attributeId];

            // Get skill rank
            const rank = this.skills[skill].rank;

            // Get attribute value
            const attrValue = attribute.value + attribute.bonus;

            // Calculate mod
            this.skills[skill].mod.value = attrValue + rank;
        });

        // Get deflect source, defaulting to armor
        const source = this.deflect.source ?? DeflectSource.Armor;

        // Derive deflect value
        if (source === DeflectSource.Armor) {
            // Find equipped armor
            const armor = this.parent.items
                .filter((item) => item.type === ItemType.Armor)
                .map(
                    (item) =>
                        item as unknown as CosmereItem<ArmorItemDataModel>,
                )
                .find((item) => item.system.equipped);

            // Derive deflect
            this.deflect.value = armor?.system.deflect ?? 0;
        }

        // Movement
        this.movement.rate.value = speedToMovementRate(
            this.attributes.spd.value,
        );

        // Injury count
        this.injuries.value = this.parent.items.filter(
            (item) => item.type === ItemType.Injury,
        ).length;

        // Derive currency conversion values
        Object.keys(this.currency).forEach((currency) => {
            // Get currency config
            const currencyConfig = CONFIG.COSMERE.currencies[currency];

            // Get currency data
            const currencyData = this.currency[currency];

            let total = 0;

            // Determine denomination derived values
            currencyData.denominations.forEach((denom) => {
                // Get denomination configs
                const denominations = currencyConfig.denominations;
                const primaryConfig = denominations.primary.find(
                    (d) => d.id === denom.id,
                );

                if (!primaryConfig) return;

                // Set conversion rate
                denom.conversionRate.value = primaryConfig.conversionRate;

                if (denom.secondaryId && !!denominations.secondary) {
                    const secondaryConfig = denominations.secondary.find(
                        (d) => d.id === denom.secondaryId,
                    );
                    denom.conversionRate.value *=
                        secondaryConfig?.conversionRate ?? 1;
                }

                // Get converted value
                denom.convertedValue.value =
                    denom.amount * denom.conversionRate.value;

                // Adjust derived total for this currency accordingly
                total += denom.convertedValue.value;
            });

            // Update derived total
            currencyData.total.value = total;
        });

        // Lifting & Carrying
        this.encumbrance.lift.value = strengthToLiftingCapacity(
            this.attributes.str.value,
        );
        this.encumbrance.carry.value = strengthToCarryingCapacity(
            this.attributes.str.value,
        );
    }
}

const SENSES_RANGES = [5, 10, 20, 50, 100, Number.MAX_VALUE];
function awarenessToSensesRange(awareness: number) {
    return SENSES_RANGES[
        Math.min(Math.ceil(awareness / 2), SENSES_RANGES.length)
    ];
}

const MOVEMENT_RATES = [20, 25, 30, 40, 60, 80];
function speedToMovementRate(speed: number) {
    return MOVEMENT_RATES[
        Math.min(Math.ceil(speed / 2), MOVEMENT_RATES.length)
    ];
}

const LIFTING_CAPACITIES = [100, 200, 500, 1000, 5000, 10000];
function strengthToLiftingCapacity(strength: number) {
    return LIFTING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), LIFTING_CAPACITIES.length)
    ];
}

const CARRYING_CAPACITIES = [50, 100, 250, 500, 2500, 5000];
function strengthToCarryingCapacity(strength: number) {
    return CARRYING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), CARRYING_CAPACITIES.length)
    ];
}
