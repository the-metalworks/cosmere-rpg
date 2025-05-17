import { DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

import { MappingField } from '@system/data/fields';

interface DeflectData {
    /**
     * Whether or not this trait is currently active.
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
                const damageTypes = CONFIG.COSMERE.damageTypes;

                return foundry.utils.mergeObject(super.defineSchema(), {
                    deflect: new foundry.data.fields.NumberField({
                        required: true,
                        initial: 0,
                        min: 0,
                        integer: true,
                    }),
                    deflects: new foundry.data.fields.SchemaField(
                        Object.keys(damageTypes).reduce(
                            (schemas, key) => {
                                schemas[key] =
                                    new foundry.data.fields.SchemaField({
                                        active: new foundry.data.fields.BooleanField(
                                            {
                                                required: true,
                                                nullable: false,
                                                initial: !(
                                                    damageTypes[
                                                        key as DamageType
                                                    ].ignoreDeflect ?? false
                                                ),
                                            },
                                        ),
                                    });

                                return schemas;
                            },
                            {} as Record<
                                string,
                                foundry.data.fields.SchemaField
                            >,
                        ),
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
        };
    };
}
