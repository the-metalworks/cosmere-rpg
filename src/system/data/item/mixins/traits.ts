import { WeaponTraitId, ArmorTraitId } from '@system/types/cosmere';
import { EmptyObject } from '@system/types/utils';

import { CosmereItem } from '@system/documents';
import { ExpertiseItemDataSchema } from './expertise';

import { MappingField } from '@system/data/fields';

const SCHEMA = () => ({
    traits: new MappingField(
        new foundry.data.fields.SchemaField({
            defaultValue: new foundry.data.fields.NumberField({
                integer: true,
            }),
            value: new foundry.data.fields.NumberField({
                integer: true,
            }),
            defaultActive: new foundry.data.fields.BooleanField(
                {
                    required: true,
                    nullable: false,
                    initial: true,
                },
            ),
            active: new foundry.data.fields.BooleanField({
                required: true,
                nullable: false,
                initial: true,
            }),
            expertise: new foundry.data.fields.SchemaField({
                toggleActive:
                    new foundry.data.fields.BooleanField(),
                value: new foundry.data.fields.NumberField({
                    integer: true,
                }),
            }),
        }),
        {
            required: true,
        }
    ),
});

export type TraitsItemDataSchema = ReturnType<typeof SCHEMA>;

type TraitsItemData = foundry.data.fields.SchemaField.InitializedData<TraitsItemDataSchema>;

export type TraitsItemDerivedData = {
    readonly traitsArray: (TraitsItemData['traits'][string] & { id: string })[]
}

/**
 * Mixin for weapon & armor traits
 */
export function TraitsItemMixin<
    TParent extends foundry.abstract.Document.Any
>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<TraitsItemDataSchema & ExpertiseItemDataSchema, TParent, EmptyObject, TraitsItemDerivedData> {
            static defineSchema() {
                const superSchema = super.defineSchema();

                if (!('expertise' in superSchema)) {
                    throw new Error(
                        'TraitsItemMixin must be used in combination with ExpertiseItemMixin and must follow it',
                    );
                }

                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
            }

            get traitsArray() {
                return Object.entries(this.traits)
                    .map(([id, trait]) => ({ id, ...trait }))
                    .sort((a, b) => a.id.localeCompare(b.id));
            }

            public prepareDerivedData(): void {
                super.prepareDerivedData();

                // Do we have expertise
                const hasExpertise = this.expertise;

                Object.values(this.traits).forEach((trait) => {
                    if (!hasExpertise) {
                        trait.active = trait.defaultActive;
                        trait.value = trait.defaultValue;
                    } else {
                        trait.active = trait.expertise.toggleActive
                            ? !trait.defaultActive
                            : trait.defaultActive;

                        trait.value =
                            trait.expertise.value ?? trait.defaultValue;
                    }
                });
            }
        };
    };
}
