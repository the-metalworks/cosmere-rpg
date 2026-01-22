import type {
    SystemEmbeddedCollectionsDocument,
    SystemEmbeddedCollectionsDocumentConstructor,
} from '../types/general';

export function hasSystemEmbeddedCollections(
    doc: foundry.abstract.Document.Any,
): doc is SystemEmbeddedCollectionsDocument;
export function hasSystemEmbeddedCollections(
    doc: foundry.abstract.Document.AnyConstructor,
): doc is SystemEmbeddedCollectionsDocumentConstructor;
export function hasSystemEmbeddedCollections(
    doc:
        | foundry.abstract.Document.Any
        | foundry.abstract.Document.AnyConstructor,
): boolean {
    return (
        'hasSystemEmbeddedCollections' in doc &&
        doc.hasSystemEmbeddedCollections === true
    );
}

export function getDocumentClassFor(uuid: string) {
    const { documentType } = foundry.utils.parseUuid(uuid);
    if (!documentType) return null;
    return CONFIG[documentType]
        .documentClass as foundry.abstract.Document.AnyConstructor | null;
}

export function getCollectionNameFor(
    parentUuid: string,
    embeddedName: foundry.abstract.Document.Type,
): string | null {
    const parentDocumentClass = getDocumentClassFor(parentUuid);
    if (!parentDocumentClass) return null;

    return parentDocumentClass.getCollectionName(embeddedName as never);
}
