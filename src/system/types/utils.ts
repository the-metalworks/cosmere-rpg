import { CosmereActor, CosmereItem } from '../documents';

export type {
    DeepPartial,
    DeepReadonly,
    AnyObject,
    EmptyObject,
    AnyMutableObject,
    InterfaceToObject,
    Mixin,
    PhantomConstructor,
    AnyConcreteConstructor,
    AnyConstructor,
    MustBeValidUuid,
    Merge,
    SimpleMerge,
    Identity,
    RemoveIndexSignatures,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';
import type {
    AnyObject,
    AnyConstructor,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';
import type { Document } from '@system/types/foundry/document';

type NativeEmbeddedTypesOf<
    DocumentType extends foundry.abstract.Document.Type,
> =
    KnownKeys<
        foundry.abstract.Document.MetadataFor<DocumentType>['embedded']
    > extends foundry.abstract.Document.EmbeddedType
        ? KnownKeys<
              foundry.abstract.Document.MetadataFor<DocumentType>['embedded']
          >
        : never;

type SystemEmbeddedTypesOf<
    DocumentType extends foundry.abstract.Document.Type,
> = DocumentType extends keyof ConfiguredSystemEmbeddedCollections
    ? keyof ConfiguredSystemEmbeddedCollections[DocumentType]
    : never;

export type EmbeddedTypesOf<
    DocumentType extends foundry.abstract.Document.Type,
> = NativeEmbeddedTypesOf<DocumentType> | SystemEmbeddedTypesOf<DocumentType>;

export type DocumentTypeOf<
    DocumentClass extends Document.Constructable.SystemConstructor,
> = DocumentClass['metadata']['name'];

export type DocumentOfType<
    DocumentName extends foundry.abstract.Document.WithSubTypes,
    SubType extends
        foundry.abstract.Document.SubTypesOf<DocumentName> = foundry.abstract.Document.SubTypesOf<DocumentName>,
> = foundry.abstract.Document.OfType<DocumentName, SubType>;

export type TypedCreateDataForName<
    DocumentName extends foundry.abstract.Document.Type,
> = foundry.abstract.Document.CreateDataForName<DocumentName> & {
    type: foundry.abstract.Document.SubTypesOf<DocumentName>;
};

export declare class AnyEmbeddedCollection extends foundry.abstract
    .EmbeddedCollection<
    foundry.abstract.Document.Any,
    foundry.abstract.Document.Any
> {
    public _initializeDocument(
        data: foundry.abstract.Document.Any['_source'],
        options: foundry.abstract.Document.ConstructionContext<foundry.abstract.Document.Any>,
    ): foundry.abstract.Document.Any | null;
}

// Constant to improve UI consistency
export const NONE = 'none';
export type Noneable<T> = T | typeof NONE;

// Simple utility type for easier null definitions, but general rule: only use it when you have one type that is nullable (i.e. prefer X | Y | null over Nullable<X | Y>)
export type Nullable<T> = T | null;

export type RemoveIndex<T> = {
    [K in keyof T as string extends K
        ? never
        : number extends K
          ? never
          : symbol extends K
            ? never
            : K]: T[K];
};

export type SharedKeys<T, U> = keyof T & keyof U;
export type KnownKeys<T> = keyof RemoveIndex<T>;

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };

// NOTE: Using `any` in the below types as the resulting types don't rely on the `any`s
// However they cannot be replaced with other types (e.g. `unknown`) without breaking dependent typings
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ConstructorOf<T> = new (...args: any[]) => T;
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;
export type Concrete<T> = T extends abstract new (...args: any) => infer R
    ? Omit<T, 'new'> & (new (...args: any[]) => R)
    : never;
export type ConstructorArguments<T> = T extends abstract new (
    ...args: infer A
) => any
    ? A
    : never;

export type ConcreteApplicationV2Constructor<
    TClass extends foundry.applications.api.ApplicationV2.AnyConstructor,
    TInstance extends
        foundry.applications.api.ApplicationV2.Any = foundry.applications.api.ApplicationV2.Any,
> = Omit<TClass, 'new'> & (new (...args: any[]) => TInstance);
export type AnyConcreteApplicationV2Constructor =
    ConcreteApplicationV2Constructor<
        foundry.applications.api.ApplicationV2.AnyConstructor,
        foundry.applications.api.ApplicationV2.Any
    >;

/* eslint-enable @typescript-eslint/no-explicit-any */

export enum MouseButton {
    /**
     * Usually the left mouse button.
     */
    Primary = 0,

    /**
     * Usually the right mouse button.
     */
    Secondary = 2,
}

// Collection which can retrieve invalid data
export type InvalidCollection<T> = Collection<T> & {
    /**
     * Get a requested item from the collection, including invalid entries
     */
    get(
        key: string,
        { strict, invalid }: { strict: boolean; invalid: boolean },
    ): T;

    invalidDocumentIds: Set<string>;
};

// Structure of globalThis when game is running that allows sidebar access
export interface GlobalUI {
    ui: {
        sidebar: Sidebar;
    };
}

/**
 * System-specific document types for clean migration typing.
 */
export type CosmereDocument = CosmereActor | CosmereItem;
type CosmereDocumentClass = typeof CosmereActor | typeof CosmereItem;

export const COSMERE_DOCUMENT_CLASSES: Record<string, CosmereDocumentClass> = {
    Actor: CosmereActor,
    Item: CosmereItem,
};

export interface RawDocumentData<T = AnyObject> {
    _id: string;
    type: string;
    name: string;
    flags: Record<string, unknown>;
    folder: string | null;
    sort: number;
    permission: {
        default: number;
        [key: string]: number;
    };
    system: T;
}

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RawActorData extends RawDocumentData<any> {
    items: RawDocumentData<any>[];
}

export interface NumberRange {
    min: number;
    max: number;
    actual?: number;
}
