import { CosmereItem, WeaponItem, ArmorItem } from '@system/documents/item';

export const DocumentTarget = {
    Self: 'self', // Match the document itself
    Sibling: 'sibling', // Match another document owned by the same parent (e.g. another item in the same actor)
    Ancestor: 'ancestor', // Match any document in the ownership chain above the document (e.g. the actor that owns an item, or the parent item of a sub-item)
    Descendant: 'descendant', // Match any document in the ownership chain below the document (e.g. sub-items of an item, or items owned by an actor)
    Parent: 'parent', // Match the direct parent document
    Child: 'child', // Match direct child documents
    Global: 'global', // Match any document in the world, must match by UUID
} as const;

export type DocumentTarget =
    (typeof DocumentTarget)[keyof typeof DocumentTarget];

export const ItemOnlyTarget = {
    EquippedWeapon: 'equipped-weapon', // Match equipped weapon items
    EquippedArmor: 'equipped-armor', // Match equipped armor items
} as const;

export type ItemOnlyTarget =
    (typeof ItemOnlyTarget)[keyof typeof ItemOnlyTarget];

export const ItemTarget = {
    ...DocumentTarget,
    ...ItemOnlyTarget,
} as const;

export type ItemTarget = (typeof ItemTarget)[keyof typeof ItemTarget];

export const MatchBy = {
    Identifier: 'identifier', // Match by the document's identifier (only applicable to items)
    Name: 'name', // Match by the document's name
    UUID: 'uuid', // Match by the document's UUID
    DocumentType: 'document-type', // Match by the document's type (e.g. Item, Actor, etc.)
} as const;

export type MatchBy = (typeof MatchBy)[keyof typeof MatchBy];

export const SINGLE_MATCH_TARGETS = [
    DocumentTarget.Self,
    DocumentTarget.Global,
    DocumentTarget.Parent,
    ItemTarget.EquippedWeapon,
    ItemTarget.EquippedArmor,
] as ItemTarget[];

interface MatchDocumentParams {
    /**
     * The document from which to start the search.
     * This is used to determine the scope of the search (e.g. siblings, ancestors, descendants)
     * and is also used as the document to match if the target is 'self'.
     */
    relativeTo: foundry.abstract.Document.Any;

    /**
     * The target type to match.
     */
    target: DocumentTarget;

    /**
     * By which operation to match the target document(s).
     */
    matchBy: MatchBy;

    /**
     * The type of document to match. Only applicable when matching by document type.  
     * Ignored if reference is provided.
     */
    documentType?: foundry.abstract.Document.Type;

    /**
     * The reference document (or UUID of the reference document) to match against.
     */
    reference?: foundry.abstract.Document.Any | string | null;

    /**
     * Whether to match all documents that meet the criteria, or just the first one found.
     */
    matchAll?: boolean;
}

interface MatchItemParams
    extends Omit<MatchDocumentParams, 'target' | 'reference'> {
    target: ItemTarget;
    reference?: CosmereItem | string | null;
}

export function matchDocuments(
    params: MatchDocumentParams,
): Promise<foundry.abstract.Document.Any[]>;
export function matchDocuments(params: MatchItemParams): Promise<CosmereItem[]>;
export async function matchDocuments({
    relativeTo,
    target,
    matchBy,
    documentType,
    reference = null,
    matchAll = false,
}: MatchDocumentParams | MatchItemParams): Promise<
    foundry.abstract.Document.Any[]
> {
    if (!reference && documentType && matchBy === 'document-type') {
        reference = getEphemeralReferenceDocument(documentType);
    }

    if (target !== 'self' && !reference)
        throw new Error('Reference document must be provided when target is not "self"');

    if (target === 'self') return [relativeTo];

    // Resolve reference document if a UUID string was provided
    const referenceDoc: foundry.abstract.Document.Any | null =
        typeof reference === 'string' ? await fromUuid(reference) : reference;
    if (!referenceDoc)
        return [];

    if (target === 'global') {
        if (matchBy !== 'uuid')
            throw new Error('Global target type only supports matching by UUID');

        return [referenceDoc];
    }

    const matcher = resolveMatcher(matchBy, referenceDoc);
    const candidates = resolveCandidateDocuments(
        relativeTo,
        target as Exclude<DocumentTarget, 'self' | 'global'>,
    );

    return matchAll ? candidates.filter(matcher) : [candidates.find(matcher)!];
}

/* --- Matchers --- */

function resolveMatcher(
    matchBy: MatchBy,
    referenceDoc: foundry.abstract.Document.Any,
): (doc: foundry.abstract.Document.Any) => boolean;
function resolveMatcher(
    matchBy: Exclude<MatchBy, 'name' | 'uuid'>,
    referenceDoc: CosmereItem,
): (doc: CosmereItem) => boolean;
function resolveMatcher(
    matchBy: MatchBy,
    referenceDoc: foundry.abstract.Document.Any,
): (doc: foundry.abstract.Document.Any) => boolean {
    if (matchBy === 'name') return getNameMatcher(referenceDoc);
    if (matchBy === 'uuid') return getUUIDMatcher(referenceDoc);
    if (matchBy === 'document-type') return getDocumentTypeMatcher(referenceDoc);

    if (matchBy === 'identifier') {
        if (!(referenceDoc instanceof CosmereItem))
            throw new Error('Match by identifier is only applicable to items');

        return getIdentifierMatcher(referenceDoc);
    }

    throw new Error(`Unsupported matchBy value: ${matchBy as string}`);
}

function getNameMatcher(referenceDoc: foundry.abstract.Document.Any) {
    return (doc: foundry.abstract.Document.Any) =>
        doc.name === referenceDoc.name;
}

function getUUIDMatcher(referenceDoc: foundry.abstract.Document.Any) {
    return (doc: foundry.abstract.Document.Any) =>
        doc.uuid === referenceDoc.uuid;
}

function getDocumentTypeMatcher(referenceDoc: foundry.abstract.Document.Any) {
    return (doc: foundry.abstract.Document.Any) =>
        doc.documentName === referenceDoc.documentName;
}

function getIdentifierMatcher(referenceItem: CosmereItem) {
    return (doc: foundry.abstract.Document.Any) =>
        doc instanceof CosmereItem &&
        doc.hasId() &&
        referenceItem.hasId() &&
        doc.system.id === referenceItem.system.id;
}

/* --- Helpers --- */

function resolveCandidateDocuments(
    relativeTo: foundry.abstract.Document.Any,
    target: Exclude<ItemTarget, 'self' | 'global'>,
): foundry.abstract.Document.Any[] {
    if (target === 'sibling') {
        if (!relativeTo.parent) return [];
        
        return Object.values(relativeTo.parent.collections)
            .flatMap((collection) => Array.from(collection))
            .filter((doc) => doc !== relativeTo);
    } else if (target === 'ancestor') {
        return getAncestors(relativeTo);
    } else if (target === 'descendant') {
        return getDescendants(relativeTo);
    } else if (target === 'parent') {
        return relativeTo.parent ? [relativeTo.parent] : [];
    } else if (target === 'child') {
        return getChildren(relativeTo);
    } else if (target === 'equipped-weapon' || target === 'equipped-armor') {
        const ancestralActor = getAncestors(relativeTo).find(
            (doc) => doc instanceof Actor,
        );
        if (!ancestralActor) return [];

        return ancestralActor.items.filter((item) =>
            target === 'equipped-weapon'
                ? item.isWeapon() && item.system.equipped
                : item.isArmor() && item.system.equipped,
        );
    }

    throw new Error(`Unsupported target type: ${target as string}`);
}

function getAncestors(
    doc?: foundry.abstract.Document.Any,
): foundry.abstract.Document.Any[] {
    if (!doc || !doc.parent) return [];
    return [doc.parent, ...getAncestors(doc.parent)];
}

function getDescendants(
    doc: foundry.abstract.Document.Any,
): foundry.abstract.Document.Any[] {
    return getChildren(doc).flatMap((child) => [
        child,
        ...getDescendants(child),
    ]);
}

function getChildren(
    doc: foundry.abstract.Document.Any,
): foundry.abstract.Document.Any[] {
    return Object.values(doc.collections).flatMap((collection) =>
        Array.from(collection),
    );
}

function getEphemeralReferenceDocument(documentType: foundry.abstract.Document.Type) {
    const docClass = CONFIG[documentType].documentClass as new (data: object) => foundry.abstract.Document.Any;

    return new docClass({
        name: 'Ephemeral Reference Document',
        type: 'base'
    });
}