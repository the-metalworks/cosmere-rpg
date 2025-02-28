import { DocumentConstructor } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes.mjs';

import {
    COSMERE_DOCUMENT_CLASSES,
    CosmereDocument,
    InvalidCollection,
} from '../types/utils';

/**
 * Helper function to get a given WorldCollection
 */
function getCollectionForDocumentType(
    documentType: string,
): WorldCollection<DocumentConstructor, string> {
    const collection = game.collections?.get(documentType);
    if (!collection) {
        throw new Error(`Failed to retrieve "${documentType}" collection`);
    }

    return collection;
}

export function getRawDocumentSources(documentType: string): unknown[] {
    return getCollectionForDocumentType(documentType)._source;
}

/**
 * Retrieve a document, allowing invalid results.
 */
export function getPossiblyInvalidDocument<T extends CosmereDocument>(
    documentType: string,
    id: string,
): T {
    return (
        getCollectionForDocumentType(documentType) as InvalidCollection<T>
    ).get(id, {
        strict: true,
        invalid: true,
    });
}

/**
 * Determine if a document is being tracked as invalid.
 */
function isDocumentInvalid(documentType: string, id: string): boolean {
    return (
        getCollectionForDocumentType(
            documentType,
        ) as InvalidCollection<CosmereDocument>
    ).invalidDocumentIds.has(id);
}

/**
 * Manually build a document from source and add it to the relevant collection.
 */
export function addDocumentToCollection(
    documentType: string,
    id: string,
    document: CosmereDocument,
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
export function fixInvalidDocument(documentType: string, id: string) {
    if (isDocumentInvalid(documentType, id)) {
        const document = getPossiblyInvalidDocument(documentType, id);

        addDocumentToCollection(documentType, id, document);
    }
}

export default {
    getRawDocumentSources,
    getPossiblyInvalidDocument,
    addDocumentToCollection,
    fixInvalidDocument,
};
