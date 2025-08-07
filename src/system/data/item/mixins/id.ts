import { CosmereItem } from '@system/documents';

interface IdItemMixinOptions<Type extends string = string> {
    initialFromName?: boolean;
    initial?: Type | (() => Type);
    choices?:
    | Type[]
    | Record<Type, string>
    | (() => Type[] | Record<Type, string>);
    label?: string;
    hint?: string;
}

function SCHEMA<Type extends string, TOptions extends IdItemMixinOptions<Type>>(options = {} as TOptions) {
    const choices =
        typeof options.choices === 'function'
            ? options.choices()
            : options.choices;

    const initial =
        typeof options.initial === 'function'
            ? options.initial()
            : options.initial;

    return {
        id: new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            initial:
                initial ??
                (options.initialFromName ? '<id>' : undefined),
            choices,
            label:
                options.label ??
                'COSMERE.Item.Sheet.Identifier.Label',
            hint:
                options.hint ??
                'COSMERE.Item.Sheet.Identifier.Hint',
        }),
    }
}

export type IdItemDataSchema<Type extends string = string, TOptions extends IdItemMixinOptions<Type> = IdItemMixinOptions<Type>> = ReturnType<typeof SCHEMA<Type, TOptions>>;
export type IdItemData = foundry.data.fields.SchemaField.InitializedData<IdItemDataSchema<string, IdItemMixinOptions>>;

export function IdItemMixin<
    TParent extends foundry.abstract.Document.Any,
    Type extends string,
    TOptions extends IdItemMixinOptions<Type> = IdItemMixinOptions<Type>,
>(options: IdItemMixinOptions<Type> = {}) {
    if (options.initialFromName && options.initial)
        throw new Error(
            'Cannot specify both initialFromName and initial options',
        );
    if (options.initialFromName && options.choices)
        throw new Error(
            'Cannot specify both initialFromName and choices options',
        );

    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<IdItemDataSchema<Type, TOptions>, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(
                    super.defineSchema(),
                    SCHEMA(options),
                );
            }

            public prepareDerivedData() {
                super.prepareDerivedData();

                if (this.id === '<id>' && options.initialFromName) {
                    this.id = this.parent.name
                        .toLowerCase()
                        .replace(/[^a-z0-9-_\s]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .split(' ')
                        .join('-') as Type;
                }
            }
        };
    };
}
