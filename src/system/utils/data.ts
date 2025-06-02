import { DatabaseGetOperation } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/_types.mjs';
import {
    COSMERE_DOCUMENT_CLASSES,
    CosmereDocument,
    InvalidCollection,
    RawDocumentData,
} from '../types/utils';
import { StoredDocument } from '@league-of-foundry-developers/foundry-vtt-types/src/types/utils.mjs';

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
        return (
            compendium.invalidDocumentIds.has(id)
                ? compendium.getInvalid(id, { strict: true })
                : await compendium.getDocument(id)
        ) as T;
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
    const collection = getCollectionForDocumentType(documentType);
    if (compendium) {
        // We can't just coerce the compendium to a generic collection
        // because the database is expecting packs to have "packData"
        compendium.set(id, documentToAdd as StoredDocument<CosmereDocument>);
    } else {
        (collection as Collection<CosmereDocument>).set(id, documentToAdd);
    }

    // Stop tracking this id as invalid.
    // This is mostly just to clean up the warning
    // at the bottom of the sidebar.
    (
        compendium ?? (collection as InvalidCollection<CosmereDocument>)
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
    if (isDocumentInvalid(documentType, document.id)) {
        addDocumentToCollection(documentType, document.id, document);
    }
}

export default {
    getRawDocumentSources,
    getPossiblyInvalidDocument,
    addDocumentToCollection,
    fixInvalidDocument,
};
