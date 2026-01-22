// Utils
import { getCollectionNameFor } from './general';

// Types
import type { AnyObject, AnyMutableObject } from '@system/types/utils';

import type {
    AnyEmbeddedCollection,
    SystemEmbeddedCollectionsDocument,
} from '../types/general';
import type {
    DocumentSocketRequest,
    SocketResponse,
    DatabaseCRUDAction,
} from '../types/socket';

// Constants
import { SYSTEM_EMBEDDED_COLLECTIONS_KEY } from '../constants';

/* --- Type Guards --- */

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

/* --- Transforms - Request --- */

/**
 * Transforms a client socket request for a system embedded collection document
 * into an update request on the parent document, that the backend can process.
 */
export function transformRequest<
    DatabaseAction extends foundry.abstract.types.DatabaseAction,
>(
    inRequest: DocumentSocketRequest<DatabaseAction>,
): DocumentSocketRequest<'update'> {
    if (isCreateRequest(inRequest)) {
        return transformCreateRequest(inRequest);
    } else if (isUpdateRequest(inRequest)) {
        return transformUpdateRequest(inRequest);
    } else if (isDeleteRequest(inRequest)) {
        return transformDeleteRequest(inRequest);
    }

    throw new Error(`Unsupported Database Action: ${inRequest.action}`);
}

function transformCreateRequest(
    inRequest: DocumentSocketRequest<'create'>,
): DocumentSocketRequest<'update'> {
    inRequest.operation.data = inRequest.operation.data
        .filter((data) => !!data)
        .map((data) => {
            if (data instanceof foundry.abstract.Document)
                data = data.toObject();

            (data as AnyMutableObject)._id ??= foundry.utils.randomID();
            return data;
        });

    return transformRequestCommon(inRequest);
}

function transformUpdateRequest(
    inRequest: DocumentSocketRequest<'update'>,
): DocumentSocketRequest<'update'> {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const parent = inRequest.operation.parent!;
    const collection = parent.getEmbeddedCollection(
        documentType as never,
    ) as AnyEmbeddedCollection;

    (inRequest.operation.updates as AnyObject[])
        .filter((update) => !!update)
        .forEach((update) => {
            const doc = collection.get(update._id as string);
            if (!doc) return;

            doc.updateSource(update);
        });

    return transformRequestCommon(inRequest);
}

function transformDeleteRequest(
    inRequest: DocumentSocketRequest<'delete'>,
): DocumentSocketRequest<'update'> {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const parent = inRequest.operation.parent!;
    const collection = parent.getEmbeddedCollection(
        documentType as never,
    ) as AnyEmbeddedCollection;

    inRequest.operation.ids.forEach((id) => collection.delete(id));

    return transformRequestCommon(inRequest);
}

function transformRequestCommon(
    inRequest: DocumentSocketRequest<DatabaseCRUDAction>,
): DocumentSocketRequest<'update'> {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const parent = inRequest.operation
        .parent as SystemEmbeddedCollectionsDocument;
    const collection = parent.getEmbeddedCollection(documentType)!;
    const collectionName = parent.getCollectionName(documentType)!;

    const outRequest = {
        action: 'update' as const,
        broadcast: inRequest.broadcast,
        userId: inRequest.userId,
        type: inRequest.type,
        operation: {
            action: 'update',
            diff: false,
            modifiedTime: inRequest.operation.modifiedTime,
            pack: inRequest.operation.pack,
            parent: null,
            recursive: true,
            render: inRequest.operation.render,
            updates: [
                {
                    _id: parent.id,
                    system: {
                        [SYSTEM_EMBEDDED_COLLECTIONS_KEY]: {
                            [collectionName]: [
                                ...collection.toObject(),
                                ...(inRequest.action === 'create'
                                    ? (
                                          inRequest as DocumentSocketRequest<'create'>
                                      ).operation.data
                                    : []),
                            ],
                        },
                    },
                },
            ],
            isSystemEmbeddedCollectionOperation: true,
            sourceRequest: foundry.utils.mergeObject(inRequest, {
                'operation.parent': null,
            }),
        },
    };

    return outRequest;
}

/* --- Transforms - Response --- */

/**
 * Transforms a server socket response for a system embedded collection document
 * into a response that the client can handle.
 */
export function transformResponse(inResult: SocketResponse): SocketResponse {
    if (!inResult.operation.sourceRequest) return inResult;

    const inRequest = inResult.operation.sourceRequest;
    if (!inRequest.operation.parentUuid) return inResult;

    if (isCreateRequest(inRequest) || isUpdateRequest(inRequest)) {
        return transformCreateUpdateResponse(inResult, inRequest);
    } else if (isDeleteRequest(inRequest)) {
        return transformDeleteResponse(inResult, inRequest);
    }

    throw new Error(`Unsupported Database Action: ${inRequest.action}`);
}

function transformResponseCommon(
    inResult: SocketResponse,
    inRequest: DocumentSocketRequest<DatabaseCRUDAction>,
): SocketResponse {
    return {
        action: inRequest.action,
        broadcast: inResult.broadcast,
        userId: inResult.userId,
        operation: {
            action: inRequest.action,
            modifiedTime: inRequest.operation.modifiedTime,
            pack: inRequest.operation.pack,
            parentUuid: inRequest.operation.parentUuid,
            render: inRequest.operation.render,
            renderSheet: foundry.utils.getProperty(
                inRequest.operation,
                'renderSheet',
            ) as boolean,
        },
        type: inRequest.type as foundry.abstract.Document.Type,
        result: [],
    };
}

function transformCreateUpdateResponse(
    inResult: SocketResponse,
    inRequest: DocumentSocketRequest<Exclude<DatabaseCRUDAction, 'delete'>>,
): SocketResponse {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const collectionName = getCollectionNameFor(
        inRequest.operation.parentUuid!,
        documentType,
    );
    if (!collectionName) return inResult;

    return foundry.utils.mergeObject(
        transformResponseCommon(inResult, inRequest),
        {
            result: foundry.utils.getProperty(
                (inResult.result as AnyObject[])[0],
                `system.${SYSTEM_EMBEDDED_COLLECTIONS_KEY}.${collectionName}`,
            ) as AnyObject[],
        },
    );
}

function transformDeleteResponse(
    inResult: SocketResponse,
    inRequest: DocumentSocketRequest<'delete'>,
): SocketResponse {
    return foundry.utils.mergeObject(
        transformResponseCommon(inResult, inRequest),
        {
            result: inRequest.operation.ids,
        },
    );
}
