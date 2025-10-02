import {
    AnyObject,
    EmptyObject,
    AnyConstructor,
    AnyConcreteConstructor,
} from '@system/types/utils';

// NOTE: Using `any` in the below types as the resulting types don't rely on the `any`s
/* eslint-disable @typescript-eslint/no-explicit-any */

class ConcreteTypeDataModel<
    TSchema extends foundry.data.fields.DataSchema,
    TParent extends foundry.abstract.Document.Any,
    TBaseData extends AnyObject = EmptyObject,
    TDerivedData extends AnyObject = EmptyObject,
> extends foundry.abstract.TypeDataModel<
    TSchema,
    TParent,
    TBaseData,
    TDerivedData
> {}

type TypeDataModelClass<
    TSchema extends foundry.data.fields.DataSchema,
    TParent extends foundry.abstract.Document.Any,
    TBaseData extends AnyObject = EmptyObject,
    TDerivedData extends AnyObject = EmptyObject,
> = typeof ConcreteTypeDataModel<TSchema, TParent, TBaseData, TDerivedData>;
type AnyTypeDataModelClass = TypeDataModelClass<any, any, any, any>;

type Mixin<
    TMix extends AnyConcreteConstructor,
    TBase extends AnyConstructor,
> = TMix &
    TBase &
    (new (...args: any[]) => InstanceType<TMix> & InstanceType<TBase>);

type MixinFunc<
    TBase extends typeof foundry.abstract.TypeDataModel<
        any,
        any,
        any,
        any
    > = typeof foundry.abstract.TypeDataModel<any, any, any, any>,
    TMix extends AnyTypeDataModelClass = AnyTypeDataModelClass,
> = (base: TBase) => Mixin<TMix, typeof base>;

// TODO: Figure out a way to combine the base class data schema with the mixin data schema
// type ExtractMixedClasses<
//     TArray extends Array<MixinFunc>,
// > = TArray extends [infer First, ...infer Rest]
//     ? First extends MixinFunc
//     ? Rest extends Array<MixinFunc>
//     ? [ReturnType<First>, ...ExtractMixedClasses<Rest>]
//     : never
//     : never
//     : [];

// type MixArrayClasses<
//     TBase extends AnyTypeDataModelClass,
//     TArray extends Array<AnyTypeDataModelClass>
// > = TArray extends [infer First, ...infer Rest]
//     ? First extends AnyTypeDataModelClass
//     ? Rest extends Array<AnyTypeDataModelClass>
//     ? Mixin<TBase, MixArrayClasses<First, Rest>>
//     : never
//     : never
//     : (
//         TArray extends []
//         ? TBase
//         : never
//     );

export function DataModelMixin<
    TSchema extends
        foundry.data.fields.DataSchema = foundry.data.fields.DataSchema,
    TParent extends
        foundry.abstract.Document.Any = foundry.abstract.Document.Any,
    TBaseData extends AnyObject = EmptyObject,
    TDerivedData extends AnyObject = EmptyObject,
>(...mixins: MixinFunc[]) {
    return mixins.reduce(
        (base, mixin) => {
            return mixin(base);
        },
        class extends foundry.abstract.TypeDataModel<
            foundry.data.fields.DataSchema,
            foundry.abstract.Document.Any
        > {
            static defineSchema() {
                return {};
            }
        } as any, // TEMP: Workaround
    ) as typeof foundry.abstract.TypeDataModel<
        TSchema,
        TParent,
        TBaseData,
        TDerivedData
    >;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
