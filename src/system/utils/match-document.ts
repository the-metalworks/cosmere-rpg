import { CosmereItem } from '@system/documents/item';
import type { AnyEmbeddedCollection } from '@system/types/utils';

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
    EquippedItem: 'equipped-item', // Match equipped items of any type
    EquippedWeapon: 'equipped-weapon', // Match equipped weapon items
    EquippedArmor: 'equipped-armor', // Match equipped armor items
    EquippedEquipment: 'equipped-equipment', // Match equipped equipment items
} as const;
export type ItemOnlyTarget =
    (typeof ItemOnlyTarget)[keyof typeof ItemOnlyTarget];

export const ItemTarget = {
    ...DocumentTarget,
    ...ItemOnlyTarget,
} as const;
export type ItemTarget = (typeof ItemTarget)[keyof typeof ItemTarget];

export const MatchTarget = {
    ...DocumentTarget,
    ...ItemOnlyTarget,
} as const;
export type MatchTarget = (typeof MatchTarget)[keyof typeof MatchTarget];

export const MatchBy = {
    Identifier: 'identifier', // Match by the document's identifier (only applicable to items)
    Name: 'name', // Match by the document's name
    UUID: 'uuid', // Match by the document's UUID
    DocumentType: 'document-type', // Match by the document's type (e.g. Item, Actor, etc.)
} as const;
export type MatchBy = (typeof MatchBy)[keyof typeof MatchBy];

export const MatchMode = {
    First: 'first',
    Last: 'last',
    All: 'all',
} as const;
export type MatchMode = (typeof MatchMode)[keyof typeof MatchMode];

export const SINGLE_MATCH_TARGETS = [
    DocumentTarget.Self,
    DocumentTarget.Global,
    DocumentTarget.Parent,
] as MatchTarget[];

interface MatchDocumentStepParams {
    /**
     * The document relative to which this matching step
     * will be performed.
     */
    relativeTo: foundry.abstract.Document.Any;

    /**
     * The target type to match.
     */
    target: MatchTarget;

    /**
     * By which operation to match the target document(s).
     */
    matchBy: MatchBy;

    /**
     * The type of document to match. Only applicable when matching by document type.
     * Ignored if reference is provided.
     */
    documentType?: foundry.abstract.Document.Type | null;

    /**
     * The reference document (or UUID of the reference document) to match against.
     */
    reference?: foundry.abstract.Document.Any | string | null;

    /**
     * Whether to match the first, last, or all documents that meet the matching criteria.
     *
     * @default MatchMode.First
     */
    matchMode?: MatchMode;
}

interface BaseMatchDocumentParams {
    /**
     * The document from which to start the search.
     * This is used to determine the scope of the search (e.g. siblings, ancestors, descendants)
     * and is also used as the document to match if the target is 'self'.
     */
    relativeTo: foundry.abstract.Document.Any;
}

interface MatchDocumentBasicParams
    extends BaseMatchDocumentParams,
        Omit<MatchDocumentStepParams, 'relativeTo'> {}

interface MatchDocumentWithStepsParams extends BaseMatchDocumentParams {
    /**
     * The steps to perform in this search
     */
    steps: Omit<MatchDocumentStepParams, 'relativeTo'>[];
}

type MatchDocumentParams =
    | MatchDocumentBasicParams
    | MatchDocumentWithStepsParams;

export function matchDocuments(
    params: MatchDocumentParams,
): Promise<foundry.abstract.Document.Any[]> {
    return _matchDocuments(
        'steps' in params
            ? params
            : {
                  relativeTo: params.relativeTo,
                  steps: [
                      {
                          ...params,
                      },
                  ],
              },
    );
}

async function _matchDocuments(
    params: MatchDocumentWithStepsParams,
): Promise<foundry.abstract.Document.Any[]> {
    let contextDocuments = [params.relativeTo];
    for (const step of params.steps) {
        contextDocuments = (
            await Promise.all(
                contextDocuments.map((relativeTo) =>
                    matchStep({
                        ...step,
                        relativeTo,
                    }),
                ),
            )
        ).flat();
    }

    return contextDocuments;
}

async function matchStep({
    relativeTo,
    target,
    matchBy,
    documentType,
    reference = null,
    matchMode = MatchMode.First,
}: MatchDocumentStepParams): Promise<foundry.abstract.Document.Any[]> {
    if (!reference && documentType && matchBy === 'document-type') {
        reference = getEphemeralReferenceDocument(documentType);
    }

    if (target !== 'self' && target !== 'parent' && !reference)
        throw new Error(
            'Reference document must be provided when target is not "self" or "parent"',
        );

    if (target === 'self') return [relativeTo];
    if (target === 'parent') return [relativeTo.parent].filter((v) => !!v);

    // Resolve reference document if a UUID string was provided
    const referenceDoc: foundry.abstract.Document.Any | null =
        typeof reference === 'string' ? await fromUuid(reference) : reference;
    if (!referenceDoc) return [];

    if (target === 'global') {
        if (matchBy !== 'uuid')
            throw new Error(
                'Global target type only supports matching by UUID',
            );

        return [referenceDoc];
    }

    const matcher = resolveMatcher(matchBy, referenceDoc);
    const candidates = resolveCandidateDocuments(
        relativeTo,
        target as Exclude<DocumentTarget, 'self' | 'global'>,
    );

    const matchedDocuments = candidates.filter(matcher);

    if (matchMode === MatchMode.First) {
        return [matchedDocuments.find(() => true)].filter((v) => !!v);
    } else if (matchMode === MatchMode.Last) {
        return [matchedDocuments.reverse().find(() => true)].filter((v) => !!v);
    } else if (matchMode === MatchMode.All) {
        return matchedDocuments;
    } else {
        throw new Error(`Unknown match mode: "${matchMode as string}"`);
    }
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
    if (matchBy === 'document-type')
        return getDocumentTypeMatcher(referenceDoc);

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

        return Object.values<AnyEmbeddedCollection>(
            relativeTo.parent.collections,
        )
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
    } else if (
        target === 'equipped-item' ||
        target === 'equipped-weapon' ||
        target === 'equipped-armor' ||
        target === 'equipped-equipment'
    ) {
        const ancestralActor = getAncestors(relativeTo).find(
            (doc) => doc instanceof Actor,
        );
        if (!ancestralActor) return [];

        const equippedItems = ancestralActor.items.filter(
            (item) => item.isEquippable() && item.system.equipped,
        );

        return equippedItems.filter((item) =>
            target === 'equipped-item'
                ? true
                : target === 'equipped-weapon'
                  ? item.isWeapon()
                  : target === 'equipped-armor'
                    ? item.isArmor()
                    : target === 'equipped-equipment'
                      ? item.isEquipment()
                      : false,
        );
    }

    throw new Error(`Unsupported target type: ${target as string}`);
}

function getAncestors(
    doc?: foundry.abstract.Document.Any,
): foundry.abstract.Document.Any[] {
    if (!doc?.parent) return [];
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
    return Object.values<AnyEmbeddedCollection>(doc.collections).flatMap(
        (collection) => Array.from(collection),
    );
}

function getEphemeralReferenceDocument(
    documentType: foundry.abstract.Document.Type,
) {
    const docClass = CONFIG[documentType].documentClass as new (
        data: object,
    ) => foundry.abstract.Document.Any;

    return new docClass({
        name: 'Ephemeral Reference Document',
        type: 'base',
    });
}
