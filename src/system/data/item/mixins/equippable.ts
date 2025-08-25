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

function SCHEMA<TOptions extends EquippableMixinOptions>(options: TOptions) {
    const equipTypeInitial =
        typeof options.equipType?.initial === 'function'
            ? options.equipType.initial()
            : (options.equipType?.initial ?? EquipType.Wear);

    const equipTypeChoices =
        typeof options.equipType?.choices === 'function'
            ? options.equipType.choices()
            : (options.equipType?.choices ??
                Object.keys(CONFIG.COSMERE.items.equip.types));

    return {
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
                ) as HoldType[],
            }),
            hand: new foundry.data.fields.StringField({
                nullable: true,
                choices: Object.keys(
                    CONFIG.COSMERE.items.equip.hand,
                ) as EquipHand[],
            }),
        }),
    }
};

export type EquippableItemDataSchema<TOptions extends EquippableMixinOptions = EquippableMixinOptions> = ReturnType<typeof SCHEMA<TOptions>>;

export function EquippableItemMixin<
    TParent extends foundry.abstract.Document.Any,
    TOptions extends EquippableMixinOptions = EquippableMixinOptions,
>(
    options: TOptions = {} as TOptions,
) {
    return (
        base: typeof foundry.abstract.TypeDataModel<EquippableItemDataSchema<TOptions>, TParent>,
    ) => {
        return class mixin extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA(options));
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
