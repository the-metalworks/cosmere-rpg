import { Talent } from '@system/types/item';
import { CosmereItem } from '@system/documents';

import { MappingField } from '@system/data/fields';

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
                    },
                    {
                        nullable: true,
                        validate: (value?: Partial<Talent.Prerequisite>) => {
                            if (!value) return;
                            switch (value.type) {
                                case Talent.Prerequisite.Type.Talent:
                                    if (!value.talents)
                                        throw new Error(
                                            'Field "talents" is required for prerequisite rule of type "Talent"',
                                        );
                                    break;
                                case Talent.Prerequisite.Type.Attribute:
                                    if (
                                        !value.attribute ||
                                        value.attribute.length === 0
                                    )
                                        throw new Error(
                                            'Field "attribute" is required for prerequisite rule of type "Attribute"',
                                        );
                                    if (!value.value)
                                        throw new Error(
                                            'Field "value" is required for prerequisite rule of type "Attribute"',
                                        );
                                    break;
                                case Talent.Prerequisite.Type.Skill:
                                    if (
                                        !value.skill ||
                                        value.skill.length === 0
                                    )
                                        throw new Error(
                                            'Field "skill" is required for prerequisite rule of type "Skill"',
                                        );
                                    if (!value.rank)
                                        throw new Error(
                                            'Field "rank" is required for prerequisite rule of type "Skill"',
                                        );
                                    break;
                                case Talent.Prerequisite.Type.Connection:
                                    if (
                                        !value.description ||
                                        value.description.length === 0
                                    )
                                        throw new Error(
                                            'Field "description" is required for prerequisite rule of type "Connection"',
                                        );
                                    break;
                                default:
                                    return false;
                            }
                        },
                    },
                ),
            ),
            prerequisitesMet: new foundry.data.fields.BooleanField(),
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
