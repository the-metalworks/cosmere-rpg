// Utils
import { hasSystemEmbeddedCollections } from './general';

// Types
import type { AnyObject, AnyMutableObject } from '@system/types/utils';
import type { Document } from '@system/types/foundry/document';

import type {
    AnyEmbeddedCollection,
    AnyDocumentData,
    SystemEmbeddedCollectionsDocument,
} from '../types/general';
import type {
    DocumentSocketRequest,
    SocketResponse,
    DatabaseCRUDAction,
} from '../types/socket';

// Constants
import { SYSTEM_EMBEDDED_COLLECTIONS_KEY } from '../constants';

const DOCUMENT_REQUEST_TIMEOUT_WINDOW = 100;
const documentsRequestTimeoutMap = new Map<string, number>();

/* --- Queueing --- */

/**
 * Simple timeout-based queueing mechanism to ensure that multiple requests related to the same host document are processed sequentially,
 * to prevent race conditions.
 */
async function queueRequestFor(hostDocumentUuid: string): Promise<void> {
    const existingTimeout =
        documentsRequestTimeoutMap.get(hostDocumentUuid) ??
        Number.NEGATIVE_INFINITY;
    const waitTime = Math.max(0, existingTimeout - Date.now());

    documentsRequestTimeoutMap.set(
        hostDocumentUuid,
        Date.now() + waitTime + DOCUMENT_REQUEST_TIMEOUT_WINDOW,
    );
    await new Promise((res) => setTimeout(res, waitTime));
}

/* --- Type Guards --- */

export function isGetRequest(
    request: DocumentSocketRequest,
): request is DocumentSocketRequest<'get'> {
    return request.action === 'get';
}

export function isCreateRequest(
    request: DocumentSocketRequest,
): request is DocumentSocketRequest<'create'> {
    return request.action === 'create';
}

export function isUpdateRequest(
    request: DocumentSocketRequest,
): request is DocumentSocketRequest<'update'> {
    return request.action === 'update';
}

export function isDeleteRequest(
    request: DocumentSocketRequest,
): request is DocumentSocketRequest<'delete'> {
    return request.action === 'delete';
}

export function isCRUDRequest(
    request: DocumentSocketRequest,
): request is DocumentSocketRequest<DatabaseCRUDAction> {
    return (
        isCreateRequest(request) ||
        isUpdateRequest(request) ||
        isDeleteRequest(request)
    );
}

/* --- Transforms - Request --- */

/**
 * 1. Host document -> The real foundry document that ultimately contains the system embedded document (possibly via multiple levels of embedding)
 * 2. Parent document -> The immediate parent document that directly contains the system embedded document
 * 3. System embedded document -> The document inside the system embedded collection
 */

/**
 * Transforms a client socket request for a system embedded collection document
 * into an update request on the parent document, that the backend can process.
 */
export function transformRequest(
    inRequest: DocumentSocketRequest,
): Promise<DocumentSocketRequest>;
export function transformRequest(
    inRequest: DocumentSocketRequest<DatabaseCRUDAction>,
): Promise<DocumentSocketRequest<'update'>>;
export function transformRequest(
    inRequest: DocumentSocketRequest<'get'>,
): Promise<DocumentSocketRequest<'get'>>;
export async function transformRequest(
    inRequest: DocumentSocketRequest,
): Promise<DocumentSocketRequest> {
    if (isGetRequest(inRequest)) {
        return transformGetRequest(inRequest);
    } else if (isCRUDRequest(inRequest)) {
        return transformCRUDRequest(inRequest);
    }

    return inRequest;
}

function transformGetRequest(
    inRequest: DocumentSocketRequest<'get'>,
): DocumentSocketRequest<'get'> {
    const documentType = inRequest.type;
    const cls = CONFIG[documentType]?.documentClass;
    if (!hasSystemEmbeddedCollections(cls)) return inRequest;

    return transformRequestCommon(inRequest);
}

async function transformCRUDRequest(
    inRequest: DocumentSocketRequest<DatabaseCRUDAction>,
): Promise<DocumentSocketRequest> {
    if (isCreateRequest(inRequest)) assignIdsCreateRequest(inRequest);

    const targets = await getCRUDRequestTargets(inRequest);
    if (targets.length === 0) return inRequest;

    const hierarchy = new DocumentHierarchy(targets[0]);

    if (!hierarchy.includesSystemEmbedding || !hierarchy.host) {
        if (!isCreateRequest(inRequest)) return inRequest;

        return foundry.utils.mergeObject(transformRequestCommon(inRequest), {
            operation: {
                data: inRequest.operation.data.map((data) =>
                    data
                        ? toServerViewObject(
                              data as AnyDocumentData,
                              inRequest.type,
                          )
                        : data,
                ),
            },
        });
    } else {
        await queueRequestFor(hierarchy.host.uuid);

        const update = resolveUpdate(inRequest, hierarchy);

        const outRequest = {
            action: 'update',
            broadcast: inRequest.broadcast,
            userId: inRequest.userId,
            type: hierarchy.host.documentName,
            operation: {
                action: 'update',
                diff: false,
                modifiedTime: inRequest.operation.modifiedTime,
                pack: inRequest.operation.pack,
                parent: null,
                parentUuid: hierarchy.host.parent?.uuid ?? null,
                data: null,
                ids: null,
                recursive: true,
                render: inRequest.operation.render,
                updates: [update],
                targets: targets.map((doc) => ({
                    id: doc.id!,
                    uuid: doc.uuid,
                })),
                hierarchy: Array.from(hierarchy)
                    .slice(0, hierarchy.hostIndex! + 1)
                    .map((doc) => ({
                        documentName: doc.documentName,
                        id: doc.id,
                    })),
                queue: true,
            },
        };

        return foundry.utils.mergeObject(
            transformRequestCommon(inRequest),
            outRequest,
        ) as DocumentSocketRequest<'update'>;
    }
}

function assignIdsCreateRequest(request: DocumentSocketRequest<'create'>) {
    request.operation.data = request.operation.data.map((data) => {
        if (data) {
            if (data instanceof foundry.abstract.Document) {
                data = data.toObject();
            }

            if (
                !request.operation.keepId ||
                !foundry.utils.hasProperty(data, '_id')
            )
                foundry.utils.setProperty(
                    data,
                    '_id',
                    foundry.utils.randomID(),
                );
        }

        return data;
    });
}

async function getCRUDRequestTargets(
    request: DocumentSocketRequest<DatabaseCRUDAction>,
): Promise<foundry.abstract.Document.Any[]> {
    const parent =
        request.operation.parent ??
        (await fromUuid(request.operation.parentUuid));
    const pack = request.operation.pack
        ? game.packs.get(request.operation.pack)
        : null;
    const collection = (parent?.getEmbeddedCollection(request.type as never) ??
        pack ??
        CONFIG[request.type as foundry.abstract.Document.WorldType]?.collection
            .instance) as AnyEmbeddedCollection;

    if (isCreateRequest(request)) {
        const cls = CONFIG[request.type]?.documentClass as
            | Document.Constructable.AnyConstructor
            | undefined;
        if (!cls) return [];

        return request.operation.data
            .filter((data) => !!data)
            .map((data) =>
                data instanceof cls ? data : new cls(data, { parent }),
            )
            .map((doc) => {
                if (!doc.id) {
                    doc.updateSource({ _id: foundry.utils.randomID() });
                }

                return doc;
            });
    } else if (isUpdateRequest(request)) {
        return (
            request.operation.updates as (AnyDocumentData | null | undefined)[]
        )
            .filter((update) => !!update)
            .map((update) => collection.get(update._id))
            .filter((doc) => !!doc);
    } else if (isDeleteRequest(request)) {
        return request.operation.ids
            .map((id) => collection.get(id))
            .filter((doc) => !!doc);
    }

    return [];
}

function resolveUpdatedCollectionData(
    request: DocumentSocketRequest<DatabaseCRUDAction>,
    hierarchy: DocumentHierarchy,
): AnyDocumentData[] {
    const parent = hierarchy[1]; // Immediate parent document

    const creates = !isCreateRequest(request)
        ? []
        : request.operation.data
              .filter((data) => !!data)
              .map((data) => {
                  if (data instanceof foundry.abstract.Document)
                      data = data.toObject() as AnyMutableObject;

                  (data as AnyMutableObject)._id ??= foundry.utils.randomID();
                  return toServerViewObject(
                      data as AnyMutableObject,
                      request.type,
                  ) as AnyDocumentData;
              });

    const updates = !isUpdateRequest(request)
        ? {}
        : (request.operation.updates as AnyDocumentData[])
              .filter((update) => !!update)
              .reduce(
                  (acc, curr) => ({
                      ...acc,
                      [curr._id]: curr,
                  }),
                  {} as Record<string, AnyDocumentData>,
              );

    const deletes = !isDeleteRequest(request)
        ? []
        : request.operation.ids.filter((id) => !!id);

    const collection = parent.getEmbeddedCollection(
        request.type as never,
    ) as AnyEmbeddedCollection;
    if (!collection) return [];

    return [
        ...collection
            .map((doc) =>
                foundry.utils.mergeObject(
                    doc.toObject(),
                    updates[doc.id!] ?? {},
                ),
            )
            .filter((data) => !deletes.includes(data._id)),
        ...creates,
    ];
}

function resolveUpdate(
    request: DocumentSocketRequest<DatabaseCRUDAction>,
    hierarchy: DocumentHierarchy,
): AnyObject {
    const updatedCollectionData = resolveUpdatedCollectionData(
        request,
        hierarchy,
    );

    return Array.from(hierarchy)
        .slice(0, hierarchy.hostIndex! + 1) // Only walk down to the host document, since that's the document that will actually be updated
        .slice(1) // Skip the first document (request target)
        .reduce((acc, curr, index, hierarchy) => {
            const prevDocName =
                index > 0 ? hierarchy[index - 1].documentName : request.type;
            const parent =
                index < hierarchy.length - 1 ? hierarchy[index + 1] : null;
            const collection = curr.getEmbeddedCollection(
                prevDocName as never,
            ) as AnyEmbeddedCollection;
            if (!collection)
                throw new Error(
                    `Unable to find collection for embedded document type ${prevDocName} in parent document ${curr.documentName}`,
                );

            const parentCollection = parent?.getEmbeddedCollection(
                curr.documentName as never,
            ) as AnyEmbeddedCollection | null;
            if (parent && !parentCollection)
                throw new Error(
                    `Unable to find collection for embedded document type ${curr.documentName} in parent document ${parent.documentName}`,
                );

            const update = foundry.utils.mergeObject(
                curr.toObject() as AnyDocumentData,
                {
                    ...(hasSystemEmbeddedCollections(curr) &&
                    curr.isSystemEmbedding(prevDocName)
                        ? {
                              system: {
                                  [SYSTEM_EMBEDDED_COLLECTIONS_KEY]: {
                                      [collection.name]: acc,
                                  },
                              },
                              [collection.name]: undefined,
                          }
                        : {
                              [collection.name]: acc,
                          }),
                } as AnyObject,
            );

            return (
                parentCollection?.map((doc) =>
                    foundry.utils.mergeObject(
                        doc.toObject() as AnyDocumentData,
                        doc.id === curr.id ? update : {},
                    ),
                ) ?? ([update] as AnyDocumentData[])
            );
        }, updatedCollectionData)[0];
}

/**
 * Utility function to inject common metadata into transformed requests
 */
function transformRequestCommon<
    DatabaseAction extends foundry.abstract.types.DatabaseAction,
>(inRequest: DocumentSocketRequest<DatabaseAction>) {
    return foundry.utils.mergeObject(
        inRequest,
        {
            operation: {
                id: foundry.utils.randomID(),
                isSystemEmbeddedCollectionOperation: true,
                sourceRequest: foundry.utils.mergeObject(inRequest, {
                    'operation.parent': null,
                }),
            },
        },
        { inplace: false },
    ) as DocumentSocketRequest<DatabaseAction>;
}

/* --- Transforms - Response --- */

/**
 * Transforms a server socket response for a system embedded collection document
 * into a response that the client can handle.
 */
export function transformResponse(inResponse: SocketResponse): SocketResponse {
    if (!inResponse.operation.sourceRequest) return inResponse;

    const inRequest = inResponse.operation.sourceRequest;

    if (isGetRequest(inRequest)) {
        return transformGetResponse(inResponse);
    } else if (isCreateRequest(inRequest) || isUpdateRequest(inRequest)) {
        return transformCreateUpdateResponse(inResponse);
    } else if (isDeleteRequest(inRequest)) {
        return transformDeleteResponse(inResponse);
    }

    return inResponse;
}

function transformGetResponse(inResponse: SocketResponse) {
    const inRequest = inResponse.operation.sourceRequest!;

    const result = inResponse.result?.map((r) => {
        if (typeof r === 'string') return r;
        return toClientViewObject(r, inRequest.type);
    });

    return foundry.utils.mergeObject(inResponse, {
        result,
    }) as SocketResponse;
}

function transformCreateUpdateResponse(
    inResponse: SocketResponse,
): SocketResponse {
    const inRequest = inResponse.operation
        .sourceRequest as DocumentSocketRequest<DatabaseCRUDAction>;

    let result = inResponse.result;

    if (result) {
        if (inResponse.operation.hierarchy) {
            // Handle responses for system embedded collection documents
            const hostDocumentName =
                inResponse.operation.hierarchy[
                    inResponse.operation.hierarchy.length - 1
                ].documentName;

            // Walk down the reverse hierarchy, starting from the host document
            result = inResponse.operation.hierarchy
                .slice(1)
                .reverse()
                .reduce(
                    (acc, { documentName, id }, index, self) => {
                        const cls = CONFIG[documentName]?.documentClass as
                            | Document.Constructable.AnyConstructor
                            | undefined;
                        if (!cls)
                            throw new Error(
                                `Unable to find document class for document type ${documentName}`,
                            );

                        const data = acc?.find(
                            (doc) =>
                                typeof doc === 'object' &&
                                doc !== null &&
                                '_id' in doc &&
                                doc._id === id,
                        );
                        if (!data)
                            throw new Error(
                                `Unable to find data for document ${documentName} with id ${id} in response result`,
                            );

                        const nextDocumentName =
                            index < self.length - 1
                                ? self[index + 1].documentName
                                : inRequest.type;
                        const collectionName = cls.getCollectionName(
                            nextDocumentName as never,
                        );
                        if (!collectionName)
                            throw new Error(
                                `Unable to find collection name for document ${nextDocumentName}`,
                            );

                        const innerData = foundry.utils.getProperty(
                            data,
                            collectionName,
                        ) as AnyObject[] | undefined;
                        if (!innerData)
                            throw new Error(
                                `Unable to find collection data for collection ${collectionName} in document ${documentName}`,
                            );

                        return innerData;
                    },
                    result
                        .filter(
                            (doc) =>
                                typeof doc === 'object' &&
                                doc !== null &&
                                '_id' in doc,
                        )
                        .map((doc) =>
                            toClientViewObject(
                                doc as AnyObject,
                                hostDocumentName,
                            ),
                        ),
                );
        } else {
            const documentCls = CONFIG[inRequest.type]?.documentClass as
                | Document.Constructable.AnyConstructor
                | undefined;

            if (documentCls && hasSystemEmbeddedCollections(documentCls)) {
                result = result.map((doc) =>
                    toClientViewObject(doc as AnyObject, inRequest.type),
                );
            }
        }

        const targetIds = inResponse.operation.targets?.map(
            (target) => target.id,
        );
        if (targetIds)
            result = (result as AnyObject[]).filter((doc) =>
                targetIds.includes(
                    foundry.utils.getProperty(doc, '_id') as string,
                ),
            );
    }

    return foundry.utils.mergeObject(transformCRUDResponseCommon(inResponse), {
        result,
    });
}

function transformDeleteResponse(inResponse: SocketResponse): SocketResponse {
    const inRequest = inResponse.operation
        .sourceRequest as DocumentSocketRequest<'delete'>;
    if (!inRequest.operation.parentUuid) return inResponse;

    return foundry.utils.mergeObject(transformCRUDResponseCommon(inResponse), {
        result: inRequest.operation.ids,
    });
}

function transformCRUDResponseCommon(
    inResponse: SocketResponse,
): SocketResponse {
    const inRequest = inResponse.operation
        .sourceRequest as DocumentSocketRequest<DatabaseCRUDAction>;

    return {
        action: inRequest.action,
        broadcast: inResponse.broadcast,
        userId: inResponse.userId,
        operation: {
            id: inRequest.operation.id,
            action: inRequest.action,
            modifiedTime: inRequest.operation.modifiedTime,
            pack: inRequest.operation.pack,
            parentUuid: inRequest.operation.parentUuid,
            render: inRequest.operation.render,
            diff: false,
            recursive: false,
            renderSheet: foundry.utils.getProperty(
                inRequest.operation,
                'renderSheet',
            ) as boolean,
        },
        type: inRequest.type,
        result: [],
    };
}

/* --- Helpers --- */

export function toServerViewObject(
    document: foundry.abstract.Document.Any,
): AnyObject;
export function toServerViewObject(
    object: AnyMutableObject,
    documentType: foundry.abstract.Document.Type,
): AnyObject;
export function toServerViewObject(
    documentOrObject: foundry.abstract.Document.Any | AnyMutableObject,
    documentType?: foundry.abstract.Document.Type,
): AnyObject {
    let obj =
        documentOrObject instanceof foundry.abstract.Document
            ? (documentOrObject.toObject() as AnyMutableObject)
            : documentOrObject;

    if (
        !documentType &&
        !(documentOrObject instanceof foundry.abstract.Document)
    )
        throw new Error(
            'Document type must be provided when converting from a plain object',
        );

    documentType =
        documentOrObject instanceof foundry.abstract.Document
            ? documentOrObject.documentName
            : documentType!;

    const cls = CONFIG[documentType]
        ?.documentClass as Document.Constructable.AnyConstructor;

    // Handle system embedded collections
    if (hasSystemEmbeddedCollections(cls)) {
        const systemEmbeddedConfig = Object.entries(
            cls.metadata.systemEmbedded,
        ) as [foundry.abstract.Document.Type, string][];

        obj = foundry.utils.mergeObject(
            obj,
            {
                [`system.${SYSTEM_EMBEDDED_COLLECTIONS_KEY}`]:
                    systemEmbeddedConfig.reduce(
                        (acc, [embeddedName, collectionName]) => {
                            let collectionData = foundry.utils.getProperty(
                                obj,
                                collectionName,
                            ) as AnyObject[] | undefined;
                            if (!collectionData) return acc;

                            collectionData = ensureArray(collectionData);
                            if (!collectionData) {
                                console.warn(
                                    `Found non-iterable collection data for ${collectionName}. Skipping transformation for this collection.`,
                                );
                                return acc;
                            }

                            return {
                                ...acc,
                                [collectionName]:
                                    collectionData?.map((doc) =>
                                        toServerViewObject(doc, embeddedName),
                                    ) ?? [],
                            };
                        },
                        {} as Record<string, AnyObject[]>,
                    ),
            },
            { inplace: false },
        );

        systemEmbeddedConfig.forEach(([_, collectionName]) => {
            delete obj[collectionName];
        });
    }

    // Handle native embedded collections
    Object.entries(cls.metadata.embedded).forEach(
        ([embeddedName, collectionName]) => {
            let collectionData = foundry.utils.getProperty(
                obj,
                collectionName,
            ) as AnyObject[] | undefined;
            if (!collectionData) return;

            collectionData = ensureArray(collectionData);
            if (!collectionData) {
                console.warn(
                    `Found non-iterable collection data for ${collectionName}. Skipping transformation for this collection.`,
                );
                return;
            }

            foundry.utils.setProperty(
                obj,
                collectionName,
                collectionData.map((doc) =>
                    toServerViewObject(
                        doc,
                        embeddedName as foundry.abstract.Document.Type,
                    ),
                ),
            );
        },
    );

    return obj;
}

export function toClientViewObject(
    data: AnyMutableObject,
    documentType: foundry.abstract.Document.Type,
    toDocument?: false,
): AnyMutableObject;
export function toClientViewObject(
    data: AnyMutableObject,
    documentType: foundry.abstract.Document.Type,
    toDocument: true,
    parent?: foundry.abstract.Document.Any | null,
): foundry.abstract.Document.Any;
export function toClientViewObject(
    data: AnyMutableObject,
    documentType: foundry.abstract.Document.Type,
    toDocument = false,
    parent?: foundry.abstract.Document.Any | null,
): AnyMutableObject | foundry.abstract.Document.Any {
    const cls = CONFIG[documentType]?.documentClass;

    // Handle system embedded collections
    if (hasSystemEmbeddedCollections(cls)) {
        Object.entries(cls.metadata.systemEmbedded).forEach(
            ([embeddedName, collectionName]) => {
                let collectionData = foundry.utils.getProperty(
                    data,
                    `system.${SYSTEM_EMBEDDED_COLLECTIONS_KEY}.${collectionName}`,
                ) as AnyObject[] | undefined;
                if (!collectionData) return;

                collectionData = ensureArray(collectionData);
                if (!collectionData) {
                    console.warn(
                        `Found non-iterable collection data for ${collectionName}. Skipping transformation for this collection.`,
                    );
                    return;
                }

                foundry.utils.setProperty(
                    data,
                    collectionName,
                    collectionData.map((doc) =>
                        toClientViewObject(
                            doc,
                            embeddedName as foundry.abstract.Document.Type,
                        ),
                    ),
                );
            },
        );

        foundry.utils.deleteProperty(
            data,
            `system.${SYSTEM_EMBEDDED_COLLECTIONS_KEY}`,
        );
    }

    // Handle native embedded collections
    (
        Object.entries(cls.metadata.embedded) as [
            foundry.abstract.Document.Type,
            string,
        ][]
    )
        .filter(
            ([embeddedName, _]) =>
                !hasSystemEmbeddedCollections(cls) ||
                cls.isNativeEmbedding(embeddedName),
        )
        .forEach(([embeddedName, collectionName]) => {
            let collectionData = foundry.utils.getProperty(
                data,
                collectionName,
            );
            if (!collectionData) return;

            collectionData = ensureArray(collectionData);
            if (!collectionData) {
                console.warn(
                    `Found non-iterable collection data for ${collectionName}. Skipping transformation for this collection.`,
                );
                return;
            }

            foundry.utils.setProperty(
                data,
                collectionName,
                (collectionData as AnyObject[]).map((doc) =>
                    toClientViewObject(doc, embeddedName),
                ),
            );
        });

    return toDocument
        ? new (cls as Document.Constructable.AnyConstructor)(data, { parent })
        : data;
}

function ensureArray<T extends unknown[]>(collectionData: T): T;
function ensureArray(collectionData: unknown): unknown[] | null;
function ensureArray(collectionData: unknown): unknown[] | null {
    const collectionDataType = foundry.utils.getType(collectionData);
    if (collectionDataType === 'Array') return collectionData as unknown[];

    const isIterable =
        typeof collectionData === 'object' &&
        collectionData !== null &&
        Symbol.iterator in collectionData &&
        typeof collectionData[Symbol.iterator] === 'function';

    return isIterable ? Array.from(collectionData as Iterable<unknown>) : null;
}

class DocumentHierarchy<
    TOriginDocument extends
        foundry.abstract.Document.Any = foundry.abstract.Document.Any,
> {
    /**
     * Whether or not the document hierarchy includes at least one system embedding relationship
     */
    public readonly includesSystemEmbedding: boolean;

    /**
     * If the hierarchy includes a system embedding relationship, this will be the document at the root of that relationship (the "host" document). Otherwise, it will be undefined.
     * This is the first document that can be updated directly.
     */
    public readonly host?: SystemEmbeddedCollectionsDocument;
    public readonly hostIndex?: number;

    readonly [index: number]: foundry.abstract.Document.Any;

    private hierarchy: foundry.abstract.Document.Any[];

    public constructor(public readonly origin: TOriginDocument) {
        this.hierarchy = this.getDocumentParents(this.origin);

        this.includesSystemEmbedding = this.hierarchy.some((doc, index) => {
            if (index === this.hierarchy.length - 1) return false;
            const parent = this.hierarchy[index + 1];
            return (
                hasSystemEmbeddedCollections(parent) &&
                parent.isSystemEmbedding(doc.documentName)
            );
        });

        if (this.includesSystemEmbedding) {
            this.host = Array.from(this.hierarchy)
                .reverse()
                .find((doc, index, self) => {
                    if (index === self.length - 1) return false;
                    const child = self[index + 1];
                    return (
                        hasSystemEmbeddedCollections(doc) &&
                        doc.isSystemEmbedding(child.documentName)
                    );
                }) as SystemEmbeddedCollectionsDocument;
            this.hostIndex = this.hierarchy.indexOf(this.host);
        }

        // Proxy the hierarchy array so that we can access documents via index (e.g. hierarchy[0] for immediate parent, hierarchy[hierarchy.length - 1] for root parent)
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (typeof prop === 'string') {
                    const index = Number(prop);

                    if (
                        !isNaN(index) &&
                        Number.isInteger(index) &&
                        index >= 0
                    ) {
                        return target.hierarchy[index];
                    }
                }

                return Reflect.get(target, prop, receiver);
            },
        });
    }

    public get [Symbol.iterator]() {
        return this.hierarchy[Symbol.iterator].bind(this.hierarchy);
    }

    public get length() {
        return this.hierarchy.length;
    }

    private getDocumentParents(
        document: foundry.abstract.Document.Any,
    ): foundry.abstract.Document.Any[] {
        const parent = document.parent;
        if (!(parent instanceof foundry.abstract.Document)) return [document];
        return [document, ...this.getDocumentParents(parent)];
    }
}
