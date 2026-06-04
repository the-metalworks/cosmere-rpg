import { ListVisibilityType } from '@src/system/types/cosmere';

const SCHEMA = () => ({
    visibilityFilters: new foundry.data.fields.ArrayField(
        new foundry.data.fields.StringField({
            initial: ListVisibilityType.Always,
            choices: Object.keys(
                CONFIG.COSMERE.visibilityFilters,
            ) as ListVisibilityType[],
        }),
        {
            initial: [ListVisibilityType.Always] as ListVisibilityType[],
        },
    ),
});

export type ListVisibilityItemDataSchema = ReturnType<typeof SCHEMA>;
export type ListVisibilityItemData =
    foundry.data.fields.SchemaField.InitializedData<ListVisibilityItemDataSchema>;

export function ListVisibilityItemMixin<
    TParent extends foundry.abstract.Document.Any,
>() {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<ListVisibilityItemDataSchema, TParent> {
            static defineSchema() {
                return {
                    ...super.defineSchema(),
                    ...SCHEMA(),
                };
            }
        };
    };
}

export function getVisibilityFilter(filter?: ListVisibilityType) {
    if (!filter || !(filter in CONFIG.COSMERE.visibilityFilters)) {
        return CONFIG.COSMERE.visibilityFilters.neverVisible;
    }
    return CONFIG.COSMERE.visibilityFilters[filter];
}
