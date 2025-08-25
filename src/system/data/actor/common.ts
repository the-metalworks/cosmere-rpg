import {
    Size,
    CreatureType,
    MovementType,
    Attribute,
    Resource,
    AttributeGroup,
    Skill,
    DeflectSource,
    ItemType,
    DamageType,
    Status,
    ActorType,
} from '@system/types/cosmere';
import { CosmereActor } from '@system/documents/actor';
import { ArmorItem, LootItem } from '@system/documents';

import { CosmereDocument, AnyObject, EmptyObject, Merge, RemoveIndexSignatures } from '@system/types/utils';
import { InferSchema } from '../types';

// Fields
import { DerivedValueField, Derived } from '../fields/derived-value-field';
import { ExpertisesField, Expertise } from './fields/expertises-field';

export { Expertise } from './fields/expertises-field';

export interface AttributeData {
    value: number;
    bonus: number;
}

const SCHEMA = () => ({
    size: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: Size.Medium,
        choices: Object.keys(CONFIG.COSMERE.sizes) as Size[],
    }),
    type: new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            initial: CreatureType.Humanoid,
            choices: Object.keys(CONFIG.COSMERE.creatureTypes) as CreatureType[],
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
    immunities: getImmunitiesSchema(),
    attributes: getAttributesSchema(),
    defenses: getDefensesSchema(),
    resources: getResourcesSchema(),
    skills: getSkillsSchema(),
    currency: getCurrenciesSchema(),
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
                types: getDamageDeflectTypesSchema(),
            },
        },
    ),
    movement: getMovementSchema(),
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
    expertises: new ExpertisesField({
        required: true,
    }),
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
});

function getAttributesSchema() {
    const attributes = CONFIG.COSMERE.attributes;

    const constructAttributeSchema = () => new foundry.data.fields.SchemaField({
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

    return new foundry.data.fields.SchemaField(
        Object.keys(attributes).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: constructAttributeSchema()
            }),
            {} as Record<Attribute, ReturnType<typeof constructAttributeSchema>>,
        ),
    );
}

function getDefensesSchema() {
    const defenses = CONFIG.COSMERE.attributeGroups;

    const constructDefenseSchema = () => new DerivedValueField(
        new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
        }),
    );

    return new foundry.data.fields.SchemaField(
        Object.keys(defenses).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: constructDefenseSchema()
            }),
            {} as Record<AttributeGroup, ReturnType<typeof constructDefenseSchema>>,
        ),
    );
}

function getResourcesSchema() {
    const resources = CONFIG.COSMERE.resources;

    const constructResourceSchema = () => new foundry.data.fields.SchemaField({
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

    return new foundry.data.fields.SchemaField(
        Object.keys(resources).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: constructResourceSchema()
            }),
            {} as Record<Resource, ReturnType<typeof constructResourceSchema>>,
        ),
    );
}

function getSkillsSchema() {
    const skills = CONFIG.COSMERE.skills;

    const constructSkillSchema = (skill: Skill) => new foundry.data.fields.SchemaField({
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
        ...(!skills[skill].core
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

    return new foundry.data.fields.SchemaField(
        (Object.keys(skills) as Skill[]).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: constructSkillSchema(key)
            }),
            {} as Record<Skill, ReturnType<typeof constructSkillSchema>>,
        ),
    );
}

function getCurrenciesSchema() {
    const currencies = CONFIG.COSMERE.currencies;

    const constructCurrencySchema = (currencyId: string) => new foundry.data.fields.SchemaField({
        denominations: new foundry.data.fields.ArrayField(
            getCurrencyDenominationSchema(currencyId),
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

    const fields = Object.keys(currencies).reduce(
        (schemas, key) => ({
            ...schemas,
            [key]: constructCurrencySchema(key)
        }),
        {} as Record<string, ReturnType<typeof constructCurrencySchema>>,
    );

    return new foundry.data.fields.SchemaField<
        typeof fields,
        foundry.data.fields.SchemaField.Options<typeof fields>,
        Record<string, foundry.data.fields.SchemaField.InitializedData<InferSchema<(typeof fields)[string]>>> | null | undefined,
        Record<string, foundry.data.fields.SchemaField.InitializedData<InferSchema<(typeof fields)[string]>>>
    >(fields);
}

function getCurrencyDenominationSchema(currency: string) {
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

function getDamageDeflectTypesSchema() {
    const damageTypes = Object.keys(
        CONFIG.COSMERE.damageTypes,
    ) as DamageType[];

    const constructDamageTypeDeflectSchema = (type: DamageType) => new foundry.data.fields.BooleanField({
        required: true,
        nullable: false,
        initial:
            !CONFIG.COSMERE.damageTypes[type].ignoreDeflect,
    });

    return new foundry.data.fields.SchemaField(
        damageTypes.reduce(
            (schema, type) => ({
                ...schema,
                [type]: constructDamageTypeDeflectSchema
            }),
            {} as Record<DamageType, ReturnType<typeof constructDamageTypeDeflectSchema>>,
        ),
        {
            required: true,
        },
    );
}

function getImmunitiesSchema() {
    return new foundry.data.fields.SchemaField(
        {
            damage: getDamageImmunitiesSchema(),
            condition: getConditionImmunitiesSchema(),
        },
        {
            required: true,
        },
    );
}

function getDamageImmunitiesSchema() {
    const damageTypes = Object.keys(
        CONFIG.COSMERE.damageTypes,
    ) as DamageType[];

    const constructDamageTypeSchema = () => new foundry.data.fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
    });

    return new foundry.data.fields.SchemaField(
        damageTypes.reduce(
            (schema, type) => ({
                ...schema,
                [type]: constructDamageTypeSchema(),
            }),
            {} as Record<DamageType, ReturnType<typeof constructDamageTypeSchema>>,
        ),
        {
            required: true,
        },
    );
}

function getConditionImmunitiesSchema() {
    const conditions = Object.keys(CONFIG.COSMERE.statuses) as Status[];

    const constructConditionSchema = () => new foundry.data.fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
    });

    return new foundry.data.fields.SchemaField(
        conditions.reduce(
            (schema, condition) => ({
                ...schema,
                [condition]: constructConditionSchema(),
            }),
            {} as Record<Status, ReturnType<typeof constructConditionSchema>>,
        ),
        {
            required: true,
        },
    );
}

function getMovementSchema() {
    const movementTypeConfigs = CONFIG.COSMERE.movement.types;

    const constructMovementTypeSchema = () => new foundry.data.fields.SchemaField({
        rate: new DerivedValueField(
            new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
            }),
        ),
    });

    return new foundry.data.fields.SchemaField(
        Object.entries(movementTypeConfigs).reduce(
            (schema, [type, config]) => ({
                ...schema,
                [type]: constructMovementTypeSchema(),
            }),
            {} as Record<MovementType, ReturnType<typeof constructMovementTypeSchema>>,
        ),
    );
}

export type CommonActorDataSchema = ReturnType<typeof SCHEMA>;
export type CommonActorData = foundry.data.fields.SchemaField.InitializedData<CommonActorDataSchema>;

export type CommonActorDerivedData = {
    skills: Merge<CommonActorData['skills'], Record<Skill, {
        attribute: Attribute;
    }>>
};

export class CommonActorDataModel<
    TSchema extends CommonActorDataSchema = CommonActorDataSchema,
    TDerivedData extends AnyObject = AnyObject,
> extends foundry.abstract.TypeDataModel<TSchema, CosmereActor, EmptyObject, Merge<TDerivedData, CommonActorDerivedData>> {
    static defineSchema() {
        return SCHEMA();
    }

    public prepareDerivedData(): void {
        super.prepareDerivedData();

        const actor = this.parent;

        // Skill derivations
        (Object.keys(this.skills) as Skill[]).forEach((skill) => {
            // Set attribute
            this.skills[skill].attribute = CONFIG.COSMERE.skills[skill].attribute;

            // Derive unlocked status for non-core skills
            if (!CONFIG.COSMERE.skills[skill].core) {
                // Check if the actor has a power that unlocks this skill
                const unlocked = this.parent.powers.some(
                    (power) => power.system.skill === skill,
                );

                // Set unlocked status
                this.skills[skill].unlocked = unlocked;
            }
        });

        // Lock other movement types to always use override
        (Object.keys(CONFIG.COSMERE.movement.types) as MovementType[])
            .filter((type) => type !== MovementType.Walk)
            .forEach((type) => (this.movement[type].rate.useOverride = true));

        // Injury count
        this.injuries.derived = actor.items.filter(
            (item) => item.type === ItemType.Injury,
        ).length;

        const money = this.parent.items.filter(
            (item) =>
                item.isLoot() && item.system.isMoney,
        ) as LootItem[];

        // Derive currency conversion values
        Object.keys(this.currency).forEach((currency) => {
            // Get currency data
            const currencyData = this.currency[currency];

            let total = 0;

            money.forEach((item) => {
                if (item.system.price.currency !== currency) return;

                total += parseFloat(
                    (
                        item.system.price.baseValue * item.system.quantity
                    ).toFixed(2),
                );
            });

            // Update derived total
            currencyData.total.derived = total;
        });
    }

    /**
     * Apply secondary data derivations to this Data Model.
     * This is called after Active Effects are applied.
     */
    public prepareSecondaryDerivedData(): void {
        // Senses range
        this.senses.range.derived = awarenessToSensesRange(this.attributes.awa);

        // Lifting & Carrying
        this.encumbrance.lift.derived = strengthToLiftingCapacity(
            this.attributes.str,
        );
        this.encumbrance.carry.derived = strengthToCarryingCapacity(
            this.attributes.str,
        );

        // Movement
        this.movement[MovementType.Walk].rate.derived = speedToMovementRate(
            this.attributes.spd,
        );

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

        // Get deflect source, defaulting to armor
        const source = this.deflect.source ?? DeflectSource.Armor;

        // Derive deflect value
        if (source === DeflectSource.Armor) {
            // Get natural deflect value
            const natural = this.deflect.natural ?? 0;

            this.deflect.types = Object.keys(CONFIG.COSMERE.damageTypes).reduce(
                (obj, type) => {
                    obj[type as DamageType] = false;
                    return obj;
                },
                {} as Record<DamageType, boolean>,
            );

            // Find equipped armor with the highest deflect value
            const armor = this.parent.items
                .filter((item) => item.isArmor())
                .filter((item) => item.system.equipped)
                .reduce(
                    (highest, item) => {
                        return !highest ||
                            item.system.deflect > highest.system.deflect
                            ? item
                            : highest;
                    },
                    null as ArmorItem | null,
                );

            // Get armor deflect value and types
            const armorDeflect = armor?.system.deflect ?? 0;

            if (armor) {
                Object.keys(armor.system.deflects).forEach(
                    (type) =>
                    (this.deflect.types![type as DamageType] =
                        armor.system.deflects[type as DamageType].active),
                );
            } else {
                Object.keys(CONFIG.COSMERE.damageTypes).forEach(
                    (type) =>
                    (this.deflect.types![type as DamageType] = !(
                        CONFIG.COSMERE.damageTypes[type as DamageType]
                            .ignoreDeflect ?? false
                    )),
                );
            }

            // Derive deflect
            this.deflect.derived = Math.max(natural, armorDeflect);
        }

        // Clamp resource values to their max values
        (Object.keys(this.resources) as Resource[]).forEach((key) => {
            // Get the resource
            const resource = this.resources[key];

            // Get max
            const max = resource.max.value;

            // Ensure resource value is between max mand min
            resource.value = Math.max(0, Math.min(max, resource.value));
        });
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
