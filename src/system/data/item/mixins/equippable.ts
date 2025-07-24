import { EquipType, HoldType, EquipHand } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

interface EquippableMixinOptions {
    equipType?: {
        initial?: EquipType | (() => EquipType);
        choices?:
            | EquipType[]
            | Record<EquipType, string>
            | (() => EquipType[] | Record<EquipType, string>);
    };
}

export interface EquippableItemData {
    equipped: boolean;
    alwaysEquipped?: boolean;
    equip: {
        type: EquipType;
        hold?: HoldType; // Derived from two handed trait
        hand?: EquipHand;
    };
}

export function EquippableItemMixin<P extends CosmereItem>(
    options: EquippableMixinOptions = {},
) {
    return (
        base: typeof foundry.abstract.TypeDataModel<EquippableItemData, P>,
    ) => {
        return class mixin extends base {
            static defineSchema() {
                const equipTypeInitial =
                    typeof options.equipType?.initial === 'function'
                        ? options.equipType.initial()
                        : (options.equipType?.initial ?? EquipType.Wear);

                const equipTypeChoices =
                    typeof options.equipType?.choices === 'function'
                        ? options.equipType.choices()
                        : (options.equipType?.choices ??
                          Object.keys(CONFIG.COSMERE.items.equip.types));

                return foundry.utils.mergeObject(super.defineSchema(), {
                    equipped: new foundry.data.fields.BooleanField({
                        required: true,
                        nullable: false,
                        initial: false,
                        label: 'Equipped',
                    }),
                    alwaysEquipped: new foundry.data.fields.BooleanField({
                        nullable: true,
                    }),
                    equip: new foundry.data.fields.SchemaField({
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            initial: equipTypeInitial,
                            choices: equipTypeChoices,
                        }),
                        hold: new foundry.data.fields.StringField({
                            nullable: true,
                            choices: Object.keys(
                                CONFIG.COSMERE.items.equip.hold,
                            ),
                        }),
                        hand: new foundry.data.fields.StringField({
                            nullable: true,
                            choices: Object.keys(
                                CONFIG.COSMERE.items.equip.hand,
                            ),
                        }),
                    }),
                });
            }

            public prepareDerivedData() {
                super.prepareDerivedData();

                if (this.alwaysEquipped) {
                    this.equipped = true;
                }
            }
        };
    };
}
