import { EmptyObject } from '@system/types/utils';
import { CosmereItem } from '@system/documents';

interface TypedItemMixinOptions<Type extends string = string> {
    initial?: Type | (() => Type);
    choices?:
    | Type[]
    | Record<Type, string>
    | (() => Type[] | Record<Type, string>);
}

function SCHEMA<Type extends string = string>(options = {} as TypedItemMixinOptions<Type>) {
    const initial =
        typeof options.initial === 'function'
            ? options.initial()
            : options.initial;

    const choices =
        typeof options.choices === 'function'
            ? options.choices()
            : options.choices;

    const typeFieldOptions = {
        required: true,
        nullable: false,
        initial: initial ?? 'unknown',
        label: 'Type',
        choices,
    }

    return {
        type: new foundry.data.fields.StringField<typeof typeFieldOptions, Type | null | undefined, Type>(typeFieldOptions),
    }
}

export type TypedItemDataSchema<Type extends string = string> = ReturnType<typeof SCHEMA<Type>>;
export type TypedItemData = foundry.data.fields.SchemaField.InitializedData<TypedItemDataSchema<string>>;
export type TypedItemDerivedData = {
    readonly typeLabel: string;
}

export function TypedItemMixin<
    TParent extends foundry.abstract.Document.Any,
    Type extends string = string
>(options = {} as TypedItemMixinOptions<Type>) {
    return (base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<TypedItemDataSchema<Type>, TParent, EmptyObject, TypedItemDerivedData> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA(options));
            }

            get typeSelectOptions(): Record<Type, string> {
                let choices = this.schema.fields.type.choices;

                if (choices instanceof Function) choices = choices();

                if (Array.isArray(choices)) {
                    return (choices as string[]).reduce(
                        (acc, key, i) => ({
                            ...acc,
                            [i]: key,
                        }),
                        {} as Record<Type, string>,
                    );
                } else {
                    return choices as Record<Type, string>;
                }
            }

            get typeLabel(): string {
                const options = this.typeSelectOptions;
                return options[this.type] ?? this.type;
            }
        };
    };
}
