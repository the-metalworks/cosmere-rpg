import { DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

import { MappingField } from '@system/data/fields';

interface DeflectData {
    /**
     * Whether or not this deflect type is active by default.
     */
    defaultActive: boolean;

    /**
     * Whether or not this trait is currently active.
     * This is a derived value.
     */
    active: boolean;
}

export interface DeflectItemData {
    deflect: number;
    deflects: Record<DamageType, DeflectData>;
    readonly deflectsArray: ({ id: DamageType } & DeflectData)[];
}

/**
 * Mixin for deflect data
 */
export function DeflectItemMixin<P extends CosmereItem>() {
    return (
        base: typeof foundry.abstract.TypeDataModel<DeflectItemData, P>,
    ) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    deflect: new foundry.data.fields.NumberField({
                        required: true,
                        initial: 0,
                        min: 0,
                        integer: true,
                    }),
                    deflects: new MappingField(
                        new foundry.data.fields.SchemaField({
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
                        }),
                    ),
                });
            }

            get deflectsArray(): ({ id: DamageType } & DeflectData)[] {
                return (
                    Object.entries(this.deflects) as [DamageType, DeflectData][]
                )
                    .map(([id, deflect]) => ({ id, ...deflect }))
                    .sort((a, b) => a.id.localeCompare(b.id));
            }

            public prepareDerivedData(): void {
                super.prepareDerivedData();

                Object.values<DeflectData>(this.deflects).forEach((deflect) => {
                    deflect.active = deflect.defaultActive;
                });
            }
        };
    };
}
