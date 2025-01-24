import { Talent } from '@system/types/item';
import { CosmereItem } from '@system/documents';

import { MappingField, CollectionField } from '@system/data/fields';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import {
    ActivatableItemMixin,
    ActivatableItemData,
} from './mixins/activatable';
import { DamagingItemMixin, DamagingItemData } from './mixins/damaging';
import { ModalityItemMixin, ModalityItemData } from './mixins/modality';

export interface TalentItemData
    extends IdItemData,
        TypedItemData<Talent.Type>,
        DescriptionItemData,
        ActivatableItemData,
        DamagingItemData,
        ModalityItemData {
    /**
     * The id of the Path this Talent belongs to.
     */
    path?: string;
    /**
     * Derived value that indicates whether or not the parent
     * Actor has the required path. If no path is defined for this
     * Talent, this value will be undefined.
     */
    hasPath?: boolean;

    /**
     * The id of the Speciality this Talent belongs to.
     */
    specialty?: string;
    /**
     * Derived value that indicates whether or not the parent
     * Actor has the required specialty. If no specialty is defined
     * for this Talent, this value will be undefined.
     */
    hasSpecialty?: boolean;

    /**
     * The id of the Ancestry this Talent belongs to.
     */
    ancestry?: string;
    /**
     * Derived value that indicates whether or not the parent
     * Actor has the required ancestry. If no ancestry is defined
     * for this Talent, this value will be undefined.
     */
    hasAncestry?: boolean;

    /**
     * The id of the Power this Talent belongs to.
     */
    power?: string;
    /**
     * Derived value that indicates whether or not the parent
     * Actor has the required power. If no power is defined for this
     * Talent, this value will be undefined.
     */
    hasPower?: boolean;

    prerequisites: Record<string, Talent.Prerequisite>;
    readonly prerequisitesArray: ({ id: string } & Talent.Prerequisite)[];
    readonly prerequisiteTypeSelectOptions: Record<
        Talent.Prerequisite.Type,
        string
    >;

    /**
     * Derived value that indicates whether or not the
     * prerequisites have been met.
     * If no prerequisites are defined for this talent
     * This value will be `true`.
     *
     * NOTE: We have no way of checking connections as
     * they're just plain strings.
     */
    prerequisitesMet: boolean;

    /**
     * Rules that are executed when this talent is
     * obtained by an actor.
     */
    grantRules: Collection<Talent.GrantRule>;
}

export class TalentItemDataModel extends DataModelMixin<
    TalentItemData,
    CosmereItem
>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: Talent.Type.Path,
        choices: () =>
            Object.entries(CONFIG.COSMERE.items.talent.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<Talent.Type, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Talent.desc_placeholder',
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    ModalityItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            path: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                initial: null,
            }),
            hasPath: new foundry.data.fields.BooleanField(),
            specialty: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                initial: null,
            }),
            hasSpecialty: new foundry.data.fields.BooleanField(),
            ancestry: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                initial: null,
            }),
            hasAncestry: new foundry.data.fields.BooleanField(),
            power: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                initial: null,
                label: 'COSMERE.Item.Talent.Power.Label',
                hint: 'COSMERE.Item.Talent.Power.Hint',
            }),
            hasPower: new foundry.data.fields.BooleanField(),

            prerequisites: new MappingField(
                new foundry.data.fields.SchemaField(
                    {
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                            choices:
                                CONFIG.COSMERE.items.talent.prerequisite.types,
                        }),

                        // Connection
                        description: new foundry.data.fields.StringField(),

                        // Attribute
                        attribute: new foundry.data.fields.StringField({
                            blank: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.attributes,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                        }),
                        value: new foundry.data.fields.NumberField({
                            min: 0,
                            initial: 0,
                        }),

                        // Skill
                        skill: new foundry.data.fields.StringField({
                            blank: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.skills,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                        }),
                        rank: new foundry.data.fields.NumberField({
                            min: 1,
                            initial: 1,
                        }),

                        // Talent
                        label: new foundry.data.fields.StringField({
                            nullable: true,
                        }),
                        talents: new foundry.data.fields.ArrayField(
                            new foundry.data.fields.SchemaField({
                                uuid: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
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
                            }),
                            {
                                nullable: true,
                            },
                        ),
                        mode: new foundry.data.fields.StringField({
                            nullable: true,
                            blank: false,
                            choices:
                                CONFIG.COSMERE.items.talent.prerequisite.modes,
                        }),

                        // Level
                        level: new foundry.data.fields.NumberField({
                            min: 0,
                            initial: 0,
                            label: 'COSMERE.Item.Talent.Prerequisite.Level.Label',
                        }),
                    },
                    {
                        nullable: true,
                    },
                ),
            ),
            prerequisitesMet: new foundry.data.fields.BooleanField(),

            grantRules: new CollectionField(
                new foundry.data.fields.SchemaField(
                    {
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                            choices:
                                CONFIG.COSMERE.items.talent.grantRules.types,
                            label: 'COSMERE.Item.Talent.GrantRule.Type.Label',
                        }),

                        // Items
                        items: new foundry.data.fields.ArrayField(
                            new foundry.data.fields.DocumentUUIDField({
                                blank: false,
                                label: 'COSMERE.Item.Talent.GrantRule.Items.Label',
                            }),
                            {
                                required: false,
                                nullable: true,
                                initial: null,
                            },
                        ),

                        // Resource
                        resource: new foundry.data.fields.StringField({
                            required: false,
                            nullable: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.resources,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                            blank: false,
                            label: 'Cosmere.Item.Talent.GrantRule.Value.Label',
                        }),
                        value: new foundry.data.fields.StringField({
                            required: false,
                            nullable: false,
                            blank: false,
                            label: 'Cosmere.Item.Talent.GrantRule.ResourceValue',
                        }),
                    },
                    {
                        nullable: true,
                        validate: (value: Talent.GrantRule) => {
                            if (value.type === Talent.GrantRule.Type.Items) {
                                if (!value.items)
                                    throw new Error(
                                        'Field "items" is required for grant rule of type "Items"',
                                    );
                            } else if (
                                value.type === Talent.GrantRule.Type.Resource
                            ) {
                                if (!value.resource)
                                    throw new Error(
                                        'Field "resource" is required for grant rule of type "Resource"',
                                    );
                            } else {
                                throw new Error(
                                    `Invalid grant rule type "${(value as { type: string }).type}"`,
                                );
                            }
                        },
                    },
                ),
                {
                    required: true,
                    nullable: false,
                    label: 'COSMERE.Item.Talent.GrantRule.Label',
                    hint: 'COSMERE.Item.Talent.GrantRule.Hint',
                },
            ),
        });
    }

    get prerequisitesArray(): ({ id: string } & Talent.Prerequisite)[] {
        return Object.entries(this.prerequisites).map(([id, prerequisite]) => ({
            id,
            ...prerequisite,
        }));
    }

    get prerequisiteTypeSelectOptions() {
        const choices = (
            (
                this.schema.fields
                    .prerequisites as MappingField<foundry.data.fields.SchemaField>
            ).model.fields.type as foundry.data.fields.StringField
        ).choices as Record<Talent.Prerequisite.Type, string>;

        return Object.entries(choices).reduce(
            (acc, [key, label]) => ({
                ...acc,
                [key]: label,
            }),
            {} as Record<Talent.Prerequisite.Type, string>,
        );
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        // Get item
        const item = this.parent;

        // Get actor
        const actor = item.actor;

        if (this.path) {
            this.hasPath =
                actor?.items.some(
                    (item) => item.isPath() && item.id === this.path,
                ) ?? false;
        }

        if (this.specialty) {
            this.hasSpecialty =
                actor?.items.some(
                    (item) => item.isSpecialty() && item.id === this.specialty,
                ) ?? false;
        }

        if (this.ancestry) {
            this.hasAncestry =
                actor?.items.some(
                    (item) => item.isAncestry() && item.id === this.ancestry,
                ) ?? false;
        }

        if (this.power) {
            this.hasPower =
                actor?.items.some(
                    (item) => item.isPower() && item.id === this.power,
                ) ?? false;
        }

        if (!actor) {
            this.prerequisitesMet = false;
        } else {
            this.prerequisitesMet = this.prerequisitesArray.every(
                (prerequisite) => {
                    switch (prerequisite.type) {
                        case Talent.Prerequisite.Type.Talent:
                            return actor.items.some(
                                (item) =>
                                    item.isTalent() &&
                                    item.id === prerequisite.id,
                            );
                        case Talent.Prerequisite.Type.Skill:
                            return (
                                actor.system.skills[prerequisite.skill].rank >=
                                (prerequisite.rank ?? 1)
                            );
                        case Talent.Prerequisite.Type.Attribute:
                            return (
                                actor.system.attributes[prerequisite.attribute]
                                    .value >= (prerequisite.value ?? 1)
                            );
                        default:
                            return true;
                    }
                },
            );
        }
    }
}
