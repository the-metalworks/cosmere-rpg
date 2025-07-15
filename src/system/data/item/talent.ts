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
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemData,
} from './mixins/relationships';

export interface TalentItemData
    extends IdItemData,
        TypedItemData<Talent.Type>,
        DescriptionItemData,
        ActivatableItemData,
        DamagingItemData,
        ModalityItemData,
        EventsItemData,
        RelationshipsItemData {
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
    EventsItemMixin(),
    RelationshipsMixin(),
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
        });
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

        // if (!actor) {
        //     this.prerequisitesMet = false;
        // } else {
        //     this.prerequisitesMet = this.prerequisitesArray.every(
        //         (prerequisite) => {
        //             switch (prerequisite.type) {
        //                 case Talent.Prerequisite.Type.Talent:
        //                     return actor.items.some(
        //                         (item) =>
        //                             item.isTalent() &&
        //                             item.id === prerequisite.id,
        //                     );
        //                 case Talent.Prerequisite.Type.Skill:
        //                     return (
        //                         actor.system.skills[prerequisite.skill].rank >=
        //                         (prerequisite.rank ?? 1)
        //                     );
        //                 case Talent.Prerequisite.Type.Attribute:
        //                     return (
        //                         actor.system.attributes[prerequisite.attribute]
        //                             .value >= (prerequisite.value ?? 1)
        //                     );
        //                 default:
        //                     return true;
        //             }
        //         },
        //     );
        // }
    }
}
