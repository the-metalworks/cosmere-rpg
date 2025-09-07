import { DamageType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

const DAMAGE_TYPE_SCHEMA = (type: DamageType) => ({
    active: new foundry.data.fields.BooleanField(
        {
            required: true,
            nullable: false,
            initial: !(
                CONFIG.COSMERE.damageTypes[type].ignoreDeflect ?? false
            ),
        },
    ),
})

const SCHEMA = () => ({
    deflect: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
        integer: true,
    }),
    deflects: new foundry.data.fields.SchemaField(
        Object.keys(CONFIG.COSMERE.damageTypes).reduce(
            (schemas, key) => ({
                ...schemas,
                [key]: new foundry.data.fields.SchemaField(DAMAGE_TYPE_SCHEMA(key as DamageType)),
            }),
            {} as Record<
                DamageType,
                foundry.data.fields.SchemaField<ReturnType<typeof DAMAGE_TYPE_SCHEMA>>
            >,
        ),
    ),
});

export type DeflectItemDataSchema = ReturnType<typeof SCHEMA>;
export type DeflectItemData = foundry.data.fields.SchemaField.InitializedData<DeflectItemDataSchema>;
export type DeflectItemDerivedData = {
    deflectsArray: Array<
        DeflectItemData['deflects'][DamageType] & {
            id: DamageType;
        }
    >
}

/**
 * Mixin for deflect data
 */
export function DeflectItemMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<DeflectItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
            }

            get deflectsArray() {
                return (
                    Object.entries(this.deflects)
                )
                    .map(([id, deflect]) => ({ id, ...deflect }))
                    .sort((a, b) => a.id.localeCompare(b.id));
            }
        };
    };
}
