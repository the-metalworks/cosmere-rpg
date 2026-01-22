// Utils
import { hasSystemEmbeddedCollections } from './utils/general';
import { transformRequest, transformResponse } from './utils/socket';

// Types
import type { AnyObject, AnyMutableObject } from '@system/types/utils';
import type { SocketResponse, DocumentSocketRequest } from './types/socket';

// Constants
import { SYSTEM_EMBEDDED_COLLECTIONS_KEY } from './constants';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */

const EMIT_EVENT_PATCHES = {
    /**
     * Patches the emit call for the `modifyDocument` event to transform requests
     * related to system embedded collections
     */
    modifyDocument: async (
        args: any[],
        emit: (...args: any[]) => io.Socket,
    ): Promise<void | boolean> => {
        if (args.length !== 2) return;

        const request: DocumentSocketRequest = args[0];
        const callback: (response: SocketResponse) => void = args[1];

        if (typeof request !== 'object') return;
        if (typeof callback !== 'function') return;

        if (request.action === 'get') return;
        if (!request.operation.parent && !request.operation.parentUuid) return;

        const documentType = request.type as foundry.abstract.Document.Type;

        // Get parent document
        const parent =
            request.operation.parent ??
            (await fromUuid(request.operation.parentUuid));

        // Ensure parent document supports system embedded collections
        if (!parent || !hasSystemEmbeddedCollections(parent)) return;

        // Ensure parent supports this type of system embedded collection
        if (!parent.isSystemEmbedding(documentType)) return;

        // Assign parent document to request
        request.operation.parent = parent;

        // Execute transformed emit
        emit(transformRequest(request), (response: SocketResponse) =>
            callback(transformResponse(response)),
        );

        // Indicate that the emit was handled
        return true;
    },
    /**
     * Patches the emit call for the `world` event to transform the
     * response data to include system embedded collections
     */
    world: async (
        args: any[],
        emit: (...args: any[]) => io.Socket,
    ): Promise<void | boolean> => {
        if (args.length !== 1) return;

        const callback: (data: AnyMutableObject) => void = args[0];

        // Envoke the emit
        emit((data: AnyMutableObject) => {
            (
                Object.entries(foundry.documents) as [
                    foundry.abstract.Document.Type,
                    foundry.abstract.Document.AnyConstructor,
                ][]
            ).forEach(([_, cls]) => {
                if (!hasSystemEmbeddedCollections(cls)) return;

                const systemEmbeddedCollections = cls.metadata.systemEmbedded;

                const documents = (data[cls.collectionName] ??
                    []) as AnyMutableObject[];

                documents.forEach((doc) => {
                    if (
                        'system' in doc &&
                        !(
                            SYSTEM_EMBEDDED_COLLECTIONS_KEY in
                            (doc.system as AnyObject)
                        )
                    )
                        return;

                    const docSystemEmbeddedCollections = (
                        doc.system as AnyObject
                    )[SYSTEM_EMBEDDED_COLLECTIONS_KEY] as Record<
                        string,
                        AnyObject[]
                    >;
                    Object.values(systemEmbeddedCollections).forEach(
                        (collectionName) => {
                            if (
                                !(
                                    collectionName in
                                    docSystemEmbeddedCollections
                                )
                            )
                                return;
                            doc[collectionName] =
                                docSystemEmbeddedCollections[collectionName];
                        },
                    );

                    delete (doc.system as AnyMutableObject)[
                        SYSTEM_EMBEDDED_COLLECTIONS_KEY
                    ];
                });
            });

            // Call original callback with transformed data
            callback(data);
        });

        // Indicate that the emit was handled
        return true;
    },
};

const ON_EVENT_PATCHES = {
    /**
     * Patches listeners for the `modifyDocument` event to transform responses
     * for system embedded collections
     */
    modifyDocument: (args: any[]): void | any[] => {
        const response: SocketResponse = args[0];

        if (response.action !== 'update') return;
        if (!response.operation.isSystemEmbeddedCollectionOperation) return;

        // Transform response
        return [transformResponse(response)];
    },
};

/**
 * Patch Foundry's Game.connect to intercept socket messages
 * related to system embedded collections.
 *
 * This serves as an interpetation layer between the client (where our custom
 * embeds are real embedded collections) and the server (where they are stored on
 * the `system` field of the parent document).
 */
const _connect = foundry.Game.connect.bind(foundry.Game);
foundry.Game.connect = async function (this: foundry.Game, sessionId: string) {
    const socket = await _connect.call(this, sessionId);

    /**
     * Patch the socket.emit method to intercept modifyDocument requests
     */
    const _emit = socket.emit.bind(socket);
    socket.emit = function (
        this: io.Socket,
        eventName: string,
        ...args: any[]
    ) {
        if (!(eventName in EMIT_EVENT_PATCHES))
            return _emit.call(this, eventName, ...args);

        void EMIT_EVENT_PATCHES[eventName as keyof typeof EMIT_EVENT_PATCHES](
            args,
            _emit.bind(this, eventName),
        ).then((handled) => {
            if (!handled) {
                _emit.call(this, eventName, ...args);
            }
        });

        return this;
    };

    /**
     * Patch the socket.on method to intercept modifyDocument events
     */
    const _on = socket.on.bind(socket);
    socket.on = function (
        this: io.Socket,
        eventName: string,
        listener: (...args: any[]) => void,
    ) {
        if (!(eventName in ON_EVENT_PATCHES))
            return _on.call(this, eventName, listener);

        return _on.call(this, eventName, function (...args: any[]) {
            args =
                ON_EVENT_PATCHES[eventName as keyof typeof ON_EVENT_PATCHES](
                    args,
                ) ?? args;
            return listener(...args);
        });
    };

    return socket;
};

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
