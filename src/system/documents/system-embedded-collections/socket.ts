// Utils
import { Logger } from '@system/utils/logger';
import {
    transformRequest,
    transformResponse,
    toClientViewObject,
} from './utils/socket';

// Types
import type { AnyMutableObject } from '@system/types/utils';
import type { SocketResponse, DocumentSocketRequest } from './types/socket';

const logger = new Logger('systemEmbeddedCollections');

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

        const transformedRequest = await transformRequest(request);

        logger.debug('Intercepted emit call - request', {
            raw: foundry.utils.deepClone(request),
            transformed: foundry.utils.deepClone(transformedRequest),
        });

        emit(transformedRequest, (response: SocketResponse) => {
            const transformedResponse = transformResponse(response);

            logger.debug('Intercepted emit call - response', {
                raw: foundry.utils.deepClone(response),
                transformed: foundry.utils.deepClone(transformedResponse),
            });
            callback(transformedResponse);
        });

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
                const documents = (data[cls.collectionName] ??
                    []) as AnyMutableObject[];

                documents.forEach((doc) => {
                    toClientViewObject(doc, cls.documentName);
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

        logger.debug(
            'Intercepted modifyDocument event - raw',
            foundry.utils.deepClone(response),
        );

        const transformedResponse = transformResponse(
            foundry.utils.deepClone(response),
        );

        logger.debug(
            'Intercepted modifyDocument event - transformed',
            foundry.utils.deepClone(transformedResponse),
        );

        // Transform response
        return [transformedResponse];
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
