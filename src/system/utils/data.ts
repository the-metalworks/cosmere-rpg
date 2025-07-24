import { DatabaseGetOperation } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/_types.mjs';
import {
    AnyObject,
    AnyMutableObject,
    COSMERE_DOCUMENT_CLASSES,
    CosmereDocument,
    InvalidCollection,
    RawDocumentData,
} from '../types/utils';
import { StoredDocument } from '@league-of-foundry-developers/foundry-vtt-types/src/types/utils.mjs';

import { RecordCollection } from '@system/data/fields/collection';

export function cloneCollection<T = unknown>(source: Collection<T>) {
    // Get the entries
    const entries = Array.from(source.entries()).map(
        ([key, value]) =>
            [
                key,
                value instanceof foundry.abstract.DataModel
                    ? value.clone()
                    : foundry.utils.deepClone(value),
            ] as [string, T],
    );

    return source instanceof RecordCollection
        ? new RecordCollection<T>(entries)
        : new Collection<T>(entries);
}

/**
 * Utility function to get the changes between two objects for a Foundry update call.
 */
export function getObjectChanges(original: object, updated: object): AnyObject {
    // Flatten the objects
    const originalFlat = foundry.utils.flattenObject(original) as AnyObject;
    const updatedFlat = foundry.utils.flattenObject(updated) as AnyObject;

    const originalKeys = Object.keys(originalFlat);
    const updatedKeys = Object.keys(updatedFlat);

    // Determine all changed keys (updated or added)
    const changedKeys = updatedKeys.filter((key) => {
        const originalValue = originalFlat[key];
        const updatedValue = updatedFlat[key];

        // Check if the value is different
        return updatedValue !== originalValue && updatedValue !== undefined;
    });

    // Construct all keys paths in the updated object
    const updatedKeyPaths = updatedKeys
        .map((key) => {
            const keyParts = key.split('.');
            return keyParts.map((_, index) => {
                return keyParts.slice(0, index + 1).join('.');
            });
        })
        .flat()
        .filter((v, i, self) => self.indexOf(v) === i);

    // Determine all removed keys
    const removedKeys = originalKeys
        .filter((key) => {
            return !(key in updatedFlat) || updatedFlat[key] === undefined;
        })
        .map((key) => {
            // Determine to which depth the key is removed
            const keyParts = key.split('.');
            const removalDepth = [...keyParts]
                .reverse()
                .findIndex((_, i, self) => {
                    if (i === 0) return false; // Skip the last key

                    // Construct the key path
                    const path = self.slice(i).reverse().join('.');

                    // Check if the path is in the updated object
                    return updatedKeyPaths.includes(path);
                });

            return removalDepth === -1
                ? `-=${keyParts[0]}`
                : `${keyParts.slice(0, -removalDepth).join('.')}.-=${keyParts.at(-removalDepth)}`;
        })
        .filter((v, i, self) => self.indexOf(v) === i);

    // Construct the changes object
    const changes: AnyMutableObject = {};

    // Add changed keys
    changedKeys.forEach((key) => {
        changes[key] = updatedFlat[key];
    });

    // Add removed keys
    removedKeys.forEach((key) => {
        let keyParts = key.split('.');
        keyParts = [...keyParts.slice(0, -1), keyParts.at(-1)!.slice(2)];

        // Add the removal operator
        changes[key] = foundry.utils.getProperty(original, keyParts.join('.'));
    });

    return foundry.utils.expandObject(changes) as AnyObject;
}

/**
 * Helper function to get a given WorldCollection
 */
function getCollectionForDocumentType(
    documentType: string,
): WorldCollection<foundry.abstract.Document.AnyConstructor, string> {
    const collection = game.collections?.get(documentType);
    if (!collection) {
        throw new Error(`Failed to retrieve "${documentType}" collection`);
    }

    return collection;
}

export async function getRawDocumentSources<
    T extends RawDocumentData = RawDocumentData,
>(documentType: string, packID?: string): Promise<T[]> {
    const operation: DatabaseGetOperation = {
        query: {},
    };
    if (packID) operation.pack = packID;

    // NOTE: Use any type here as it keeps resolving to ManageCompendiumRequest instead of DocumentSocketRequest
    const { result } = await SocketInterface.dispatch('modifyDocument', {
        type: documentType,
        operation,
        action: 'get',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return (result as T[] | undefined) ?? [];
}

/**
 * Retrieve a document, allowing invalid results.
 */
export async function getPossiblyInvalidDocument<T extends CosmereDocument>(
    documentType: string,
    id: string,
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
): Promise<T> {
    if (compendium) {
        if (compendium.invalidDocumentIds.has(id)) {
            return compendium.getInvalid(id, { strict: true }) as T;
        }
        return (await compendium.getDocument(id)) as unknown as T;
    } else {
        return (
            getCollectionForDocumentType(documentType) as InvalidCollection<T>
        ).get(id, {
            strict: true,
            invalid: true,
        });
    }
}

/**
 * Determine if a document is being tracked as invalid.
 */
function isDocumentInvalid(
    documentType: string,
    id: string,
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
): boolean {
    return (
        compendium ??
        (getCollectionForDocumentType(
            documentType,
        ) as InvalidCollection<CosmereDocument>)
    ).invalidDocumentIds.has(id);
}

/**
 * Manually build a document from source and add it to the relevant collection.
 */
export function addDocumentToCollection(
    documentType: string,
    id: string,
    document: CosmereDocument,
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    // Get the correct document class for the static fromSource call.
    // This is extremely important for foundry to recognize the new
    // document as an actual instance of the documentClass that the
    // collection stores.
    const documentClass = COSMERE_DOCUMENT_CLASSES[documentType];

    // Build from source; cast to CosmereDocument because the static
    // method declarations in Actor, Item, etc. must return `this`.
    // We want an instance of the actual class we're calling from.
    const documentToAdd = documentClass.fromSource(
        document._source,
    ) as unknown as CosmereDocument;

    // Manually update collection with document.
    const collection = compendium ?? getCollectionForDocumentType(documentType);
    (collection as Collection<CosmereDocument>).set(id, documentToAdd);

    // Stop tracking this id as invalid.
    // This is mostly just to clean up the warning
    // at the bottom of the sidebar.
    (
        collection as InvalidCollection<CosmereDocument>
    ).invalidDocumentIds.delete(id);
}

/**
 * Ensure that, if invalid, a given document is reinstantiated.
 * This eliminates the need to reload after migrations finish,
 * in order for those actors to appear in the sidebar.
 */
export function fixInvalidDocument(
    documentType: string,
    document: CosmereDocument,
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    if (isDocumentInvalid(documentType, document.id, compendium)) {
        addDocumentToCollection(
            documentType,
            document.id,
            document,
            compendium,
        );
    }
}

export default {
    getRawDocumentSources,
    getPossiblyInvalidDocument,
    addDocumentToCollection,
    fixInvalidDocument,
};
