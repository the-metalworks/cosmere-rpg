import {
    Size,
    CreatureType,
    MovementType,
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
import { ArmorItem, LootItem } from '@system/documents';

// Fields
import { DerivedValueField, Derived } from '../fields/derived-value-field';

interface DeflectData extends Derived<number> {
    /**
     * The natural deflect value for this actor.
     * This value is used when deflect cannot be derived from its source, or
     * when the natural value is higher than the derived value.
     */
    natural?: number;

    /**
     * The source of the deflect value
     */
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

export interface AttributeData {
    value: number;
    bonus: number;
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
    attributes: Record<Attribute, AttributeData>;
    defenses: Record<AttributeGroup, Derived<number>>;
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
        {
            attribute: Attribute;
            rank: number;
            mod: Derived<number>;

            /**
             * Derived field describing whether this skill is unlocked or not.
             * This field is only present for non-core skills.
             * Core skills are always unlocked.
             */
            unlocked?: boolean;
        }
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
    // movement: {
    //     rate: Derived<number>;
    // };
    movement: Record<MovementType, { rate: Derived<number> }>;
    encumbrance: {
        lift: Derived<number>;
        carry: Derived<number>;
    };
    expertises?: ExpertiseData[];
    languages?: string[];
    biography?: string;
    appearance?: string;
    notes?: string;
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
                        natural: new foundry.data.fields.NumberField({
                            required: false,
                            nullable: true,
                            integer: true,
                            initial: 0,
                            label: 'COSMERE.Deflect.Natural.Label',
                            hint: 'COSMERE.Deflect.Natural.Hint',
                        }),
                        source: new foundry.data.fields.StringField({
                            initial: DeflectSource.Armor,
                            choices: Object.keys(
                                CONFIG.COSMERE.deflect.sources,
                            ),
                        }),
                    },
                },
            ),
            movement: this.getMovementSchema(),
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

            /**
             * HTML Fields
             */
            biography: new foundry.data.fields.HTMLField({
                label: 'COSMERE.Actor.Biography.Label',
                initial: '',
            }),
            appearance: new foundry.data.fields.HTMLField({
                label: 'COSMERE.Actor.Appearance.Label',
                initial: '',
            }),
            notes: new foundry.data.fields.HTMLField({
                label: 'COSMERE.Actor.Notes.Label',
                initial: '',
            }),
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
                    schemas[key] = new DerivedValueField(
                        new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0,
                        }),
                    );

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

                        // Only present for non-core skills
                        ...(!skills[key].core
                            ? {
                                  unlocked:
                                      new foundry.data.fields.BooleanField({
                                          required: true,
                                          nullable: false,
                                          initial: false,
                                      }),
                              }
                            : {}),
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

    private static getMovementSchema() {
        const movementTypeConfigs = CONFIG.COSMERE.movement.types;

        return new foundry.data.fields.SchemaField(
            Object.entries(movementTypeConfigs).reduce(
                (schema, [type, config]) => ({
                    ...schema,
                    [type]: new foundry.data.fields.SchemaField({
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
                }),
                {} as Record<string, foundry.data.fields.SchemaField>,
            ),
        );
    }

    public prepareDerivedData(): void {
        super.prepareDerivedData();

        this.senses.range.derived = awarenessToSensesRange(this.attributes.awa);

        // Derive defenses
        (Object.keys(this.defenses) as AttributeGroup[]).forEach((group) => {
            // Get attributes
            const attrs = CONFIG.COSMERE.attributeGroups[group].attributes;

            // Get attribute values
            const attrValues = attrs.map((key) => this.attributes[key].value);

            // Sum attribute values
            const attrsSum = attrValues.reduce((sum, v) => sum + v, 0);

            // Assign defense
            this.defenses[group].derived = 10 + attrsSum;
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
            this.skills[skill].mod.derived = attrValue + rank;
        });

        // Derive non-core skill unlocks
        (Object.keys(this.skills) as Skill[]).forEach((skill) => {
            if (CONFIG.COSMERE.skills[skill].core) return;

            // Check if the actor has a power that unlocks this skill
            const unlocked = this.parent.powers.some(
                (power) => power.system.skill === skill,
            );

            // Set unlocked status
            this.skills[skill].unlocked = unlocked;
        });

        // Get deflect source, defaulting to armor
        const source = this.deflect.source ?? DeflectSource.Armor;

        // Derive deflect value
        if (source === DeflectSource.Armor) {
            // Get natural deflect value
            const natural = this.deflect.natural ?? 0;

            // Find equipped armor with the highest deflect value
            const armor = this.parent.items
                .filter((item) => item.isArmor())
                .filter((item) => item.system.equipped)
                .reduce(
                    (highest, item) =>
                        !highest || item.system.deflect > highest.system.deflect
                            ? item
                            : highest,
                    null as ArmorItem | null,
                );

            // Get armor deflect value
            const armorDeflect = armor?.system.deflect ?? 0;

            // Derive deflect
            this.deflect.derived = Math.max(natural, armorDeflect);
        }

        // Movement
        this.movement[MovementType.Walk].rate.derived = speedToMovementRate(
            this.attributes.spd,
        );

        // Lock other movement types to always use override
        (Object.keys(CONFIG.COSMERE.movement.types) as MovementType[])
            .filter((type) => type !== MovementType.Walk)
            .forEach((type) => (this.movement[type].rate.useOverride = true));

        // Injury count
        this.injuries.derived = this.parent.items.filter(
            (item) => item.type === ItemType.Injury,
        ).length;

        const money = this.parent.items.filter(
            (item) =>
                item.type === ItemType.Loot &&
                (item as LootItem).system.isMoney,
        ) as LootItem[];

        // Derive currency conversion values
        Object.keys(this.currency).forEach((currency) => {
            // Get currency data
            const currencyData = this.currency[currency];

            let total = 0;

            money.forEach((item) => {
                if (item.system.price.currency !== currency) return;

                total += item.system.price.baseValue;
            });

            // Update derived total
            currencyData.total.derived = total;
        });

        // Lifting & Carrying
        this.encumbrance.lift.derived = strengthToLiftingCapacity(
            this.attributes.str,
        );
        this.encumbrance.carry.derived = strengthToCarryingCapacity(
            this.attributes.str,
        );
    }
}

const SENSES_RANGES = [5, 10, 20, 50, 100, Number.MAX_VALUE];
function awarenessToSensesRange(attr: AttributeData) {
    const awareness = attr.value + attr.bonus;
    return SENSES_RANGES[
        Math.min(Math.ceil(awareness / 2), SENSES_RANGES.length)
    ];
}

const MOVEMENT_RATES = [20, 25, 30, 40, 60, 80];
function speedToMovementRate(attr: AttributeData) {
    const speed = attr.value + attr.bonus;
    return MOVEMENT_RATES[
        Math.min(Math.ceil(speed / 2), MOVEMENT_RATES.length)
    ];
}

const LIFTING_CAPACITIES = [100, 200, 500, 1000, 5000, 10000];
function strengthToLiftingCapacity(attr: AttributeData) {
    const strength = attr.value + attr.bonus;
    return LIFTING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), LIFTING_CAPACITIES.length)
    ];
}

const CARRYING_CAPACITIES = [50, 100, 250, 500, 2500, 5000];
function strengthToCarryingCapacity(attr: AttributeData) {
    const strength = attr.value + attr.bonus;
    return CARRYING_CAPACITIES[
        Math.min(Math.ceil(strength / 2), CARRYING_CAPACITIES.length)
    ];
}
