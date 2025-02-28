import { CosmereActor, CosmereItem } from '../documents';

export {
    DeepPartial,
    AnyObject,
    EmptyObject,
} from '@league-of-foundry-developers/foundry-vtt-types/src/types/utils.mjs';

// Constant to improve UI consistency
export const NONE = 'none';

// Simple utility type for easier null definitions, but general rule: only use it when you have one type that is nullable (i.e. prefer X | Y | null over Nullable<X | Y>)
export type Nullable<T> = T | null;

export type SharedKeys<T, U> = keyof T & keyof U;

// NOTE: Using `any` in the below types as the resulting types don't rely on the `any`s
// However they cannot be replaced with other types (e.g. `unknown`) without breaking dependent typings

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorOf<T> = new (...args: any[]) => T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

export type Mixin<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BaseClass extends abstract new (...args: any[]) => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MixinClass extends new (...args: any[]) => any,
> = BaseClass & MixinClass;

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
