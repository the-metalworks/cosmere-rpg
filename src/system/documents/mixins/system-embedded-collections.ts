import type { AnyMutableObject, AnyObject } from '@system/types/utils';
import type { Document } from '@system/types/foundry/document';

type DatabaseCRUDAction = Exclude<foundry.abstract.types.DatabaseAction, 'get'>;

type CustomEmbeddedCollectionsConfig = {
    [K in foundry.abstract.Document.Type]?: string;
};

interface SystemEmbeddedCollectionsDocumentConstructor
    extends foundry.abstract.Document.AnyConstructor {
    hasSystemEmbeddedCollections: true;
    isNativeEmbedding(embeddedName: string): boolean;
    isSystemEmbedding(embeddedName: string): boolean;
    metadata: foundry.abstract.Document.Metadata.Any & {
        systemEmbedded: CustomEmbeddedCollectionsConfig;
    };
}

interface SystemEmbeddedCollectionsDocument
    extends foundry.abstract.Document.Any {
    hasSystemEmbeddedCollections: true;
    isNativeEmbedding(embeddedName: string): boolean;
    isSystemEmbedding(embeddedName: string): boolean;
    getCollectionName(
        embeddedName: foundry.abstract.Document.Type,
    ): string | null;
    getEmbeddedCollection(
        embeddedName: foundry.abstract.Document.Type,
    ): AnyEmbeddedCollection | null;
}

declare class AnyEmbeddedCollection extends foundry.abstract.EmbeddedCollection<
    foundry.abstract.Document.Any,
    foundry.abstract.Document.Any
> {
    public _initializeDocument(
        data: foundry.abstract.Document.Any['_source'],
        options: foundry.abstract.Document.ConstructionContext<foundry.abstract.Document.Any>,
    ): foundry.abstract.Document.Any | null;
}

interface SocketResponse
    extends Omit<foundry.helpers.SocketInterface.SocketResponse, 'request'> {
    action: foundry.abstract.types.DatabaseAction;
    broadcast?: boolean;
    operation: Omit<foundry.abstract.types.DatabaseOperation, 'data'> & {
        action: foundry.abstract.types.DatabaseAction;
        modifiedTime: number;
        render?: boolean;
        renderSheet?: boolean;
        isSystemEmbeddedCollectionOperation?: boolean;
        sourceRequest?: foundry.abstract.types.DocumentSocketRequest<foundry.abstract.types.DatabaseAction>;
    };
    type: foundry.abstract.Document.Type;
}

const SYSTEM_EMBEDDED_COLLECTIONS_KEYS = '__systemEmbeddedCollections' as const;

export function SystemEmbeddedCollectionsMixin<
    const DocumentClass extends Document.Constructable.SystemConstructor,
>(cls: DocumentClass, config: CustomEmbeddedCollectionsConfig) {
    return class SystemEmbeddedCollectionsDocument extends cls {
        // Markers to flag system embedded collection support
        public static readonly hasSystemEmbeddedCollections: true = true;
        public readonly hasSystemEmbeddedCollections: true = true;

        declare static __schema: foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>;

        static metadata = Object.freeze(
            foundry.utils.mergeObject(
                super.metadata,
                {
                    embedded: config,
                    systemEmbedded: config,
                },
                { inplace: false },
            ),
        );

        public static defineSchema() {
            const baseSchema = super.defineSchema();

            return foundry.utils.mergeObject(
                (
                    Object.entries(config) as [
                        foundry.abstract.Document.Type,
                        string,
                    ][]
                ).reduce(
                    (schema, [embeddedName, collectionName]) => ({
                        ...schema,
                        [collectionName]: new PseudoEmbeddedCollectionField(
                            foundry.documents[`Base${embeddedName}`],
                        ),
                    }),
                    {},
                ),
                baseSchema,
            ) as unknown as typeof baseSchema;
        }

        public static get schema(): foundry.data.fields.SchemaField<foundry.data.fields.DataSchema> {
            if (this.__schema) return this.__schema;

            const base = this.baseDocument;
            if (!base.hasOwnProperty('__schema')) {
                const schema = new foundry.data.fields.SchemaField(
                    this.defineSchema(),
                );
                Object.defineProperty(base, '__schema', {
                    value: schema,
                    writable: false,
                });
            }
            Object.defineProperty(this, '__schema', {
                value: (base as unknown as { __schema: unknown }).__schema,
                writable: false,
            });

            return this.__schema;
        }

        public static isNativeEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return (
                !!collectionName &&
                embeddedName in this.metadata.embedded &&
                !(embeddedName in this.metadata.systemEmbedded)
            );
        }

        public isNativeEmbedding(embeddedName: string): boolean {
            return (
                this.constructor as unknown as SystemEmbeddedCollectionsDocument
            ).isNativeEmbedding(embeddedName);
        }

        public static isSystemEmbedding(embeddedName: string): boolean {
            const collectionName = this.getCollectionName(
                embeddedName as never,
            );
            return (
                !!collectionName && embeddedName in this.metadata.systemEmbedded
            );
        }

        public isSystemEmbedding(embeddedName: string): boolean {
            return (
                this.constructor as unknown as SystemEmbeddedCollectionsDocument
            ).isSystemEmbedding(embeddedName);
        }

        public getCollectionName(embeddedName: foundry.abstract.Document.Type) {
            return (
                this
                    .constructor as unknown as SystemEmbeddedCollectionsDocumentConstructor
            ).getCollectionName(embeddedName as never);
        }
    };
}

class PseudoEmbeddedCollectionField<
    const ElementFieldType extends foundry.abstract.Document.AnyConstructor,
    const ParentDataModel extends foundry.abstract.Document.Any,
> extends foundry.data.fields.EmbeddedCollectionField<
    ElementFieldType,
    ParentDataModel
> {
    public override apply<Value, Options, Return>(
        fn:
            | keyof this
            | ((this: this, value: Value, options: Options) => Return),
        value?: Value,
        options?: Options,
    ): Return {
        // Prevent recursive invocations
        const applied =
            (
                options as
                    | { _applied?: foundry.data.fields.DataField.Any[] }
                    | undefined
            )?._applied ?? ([] as foundry.data.fields.DataField.Any[]);
        if (applied.includes(this)) return value as unknown as Return;
        else
            return super.apply(fn, value, {
                ...options,
                _applied: [...applied, this],
            } as Options);
    }
}

const _dispatch = foundry.helpers.SocketInterface.dispatch;
foundry.helpers.SocketInterface.dispatch = async function <
    DatabaseAction extends foundry.abstract.types.DatabaseAction,
>(
    this: any,
    eventName: string,
    request: foundry.abstract.types.DocumentSocketRequest<DatabaseAction>,
): Promise<foundry.helpers.SocketInterface.SocketResponse> {
    if (request.action === 'get' || eventName !== 'modifyDocument')
        return _dispatch.call(this, eventName, request);
    if (!request.operation.parent && !request.operation.parentUuid)
        return _dispatch.call(this, eventName, request);

    const documentType = request.type as foundry.abstract.Document.Type;

    // Get parent document
    const parent =
        request.operation.parent ??
        (await fromUuid(request.operation.parentUuid!));

    // Ensure parent document supports system embedded collections
    if (!parent || !hasSystemEmbeddedCollections(parent))
        return _dispatch.call(this, eventName, request);

    // Ensure parent supports this type of system embedded collection
    if (!parent.isSystemEmbedding(documentType))
        return _dispatch.call(this, eventName, request);

    // Assign parent document to request
    request.operation.parent = parent;

    const response = await _dispatch.call(
        this,
        eventName,
        transformRequest(request),
    );
    return transformResponse(
        response as unknown as SocketResponse,
    ) as unknown as foundry.helpers.SocketInterface.SocketResponse;
};

const _getData = foundry.Game.getData;
foundry.Game.getData = async function (socket: any, view: any) {
    const data = (await _getData.call(this, socket, view)) as AnyMutableObject;

    (
        Object.entries(foundry.documents) as [
            foundry.abstract.Document.Type,
            foundry.abstract.Document.AnyConstructor,
        ][]
    ).forEach(([documentType, cls]) => {
        if (!hasSystemEmbeddedCollections(cls)) return;

        const systemEmbeddedCollections = cls.metadata.systemEmbedded;

        const documents = (data[cls.collectionName] ??
            []) as AnyMutableObject[];

        documents.forEach((doc) => {
            if (
                'system' in doc &&
                !(SYSTEM_EMBEDDED_COLLECTIONS_KEYS in (doc.system as AnyObject))
            )
                return;

            const docSystemEmbeddedCollections = (doc.system as AnyObject)[
                SYSTEM_EMBEDDED_COLLECTIONS_KEYS
            ] as Record<string, AnyObject[]>;
            Object.values(systemEmbeddedCollections).forEach(
                (collectionName) => {
                    if (!(collectionName in docSystemEmbeddedCollections))
                        return;
                    doc[collectionName] =
                        docSystemEmbeddedCollections[collectionName];
                },
            );

            delete (doc.system as AnyMutableObject)[
                SYSTEM_EMBEDDED_COLLECTIONS_KEYS
            ];
        });
    });

    return data;
};

const _connect = foundry.Game.connect;
foundry.Game.connect = async function (this: foundry.Game, sessionId: string) {
    const socket = await _connect.call(this, sessionId);

    const _on = socket.on;
    socket.on = function (
        this: unknown,
        eventName: string,
        listener: (...args: any[]) => void,
    ) {
        if (eventName !== 'modifyDocument')
            return _on.call(this, eventName, listener);

        return _on.call(this, eventName, function (response: SocketResponse) {
            if (response.action !== 'update') return listener(response);
            if (!response.operation.isSystemEmbeddedCollectionOperation)
                return listener(response);

            // Transform response
            response = transformResponse(response);

            // Invoke listener
            return listener(response);
        });
    };

    return socket;
};

/* --- Helpers -- */

function isCreateRequest(
    request: foundry.abstract.types.DocumentSocketRequest<foundry.abstract.types.DatabaseAction>,
): request is foundry.abstract.types.DocumentSocketRequest<'create'> {
    return request.action === 'create';
}

function isUpdateRequest(
    request: foundry.abstract.types.DocumentSocketRequest<foundry.abstract.types.DatabaseAction>,
): request is foundry.abstract.types.DocumentSocketRequest<'update'> {
    return request.action === 'update';
}

function isDeleteRequest(
    request: foundry.abstract.types.DocumentSocketRequest<foundry.abstract.types.DatabaseAction>,
): request is foundry.abstract.types.DocumentSocketRequest<'delete'> {
    return request.action === 'delete';
}

function transformRequest<
    DatabaseAction extends foundry.abstract.types.DatabaseAction,
>(
    inRequest: foundry.abstract.types.DocumentSocketRequest<DatabaseAction>,
): foundry.abstract.types.DocumentSocketRequest<'update'> {
    if (isCreateRequest(inRequest)) {
        return transformCreateRequest(inRequest);
    } else if (isUpdateRequest(inRequest)) {
        return transformUpdateRequest(inRequest);
    } else if (isDeleteRequest(inRequest)) {
        return transformDeleteRequest(inRequest);
    }

    throw new Error(`Unsupported Database Action: ${inRequest.action}`);
}

function transformRequestCommon(
    inRequest: foundry.abstract.types.DocumentSocketRequest<DatabaseCRUDAction>,
): foundry.abstract.types.DocumentSocketRequest<'update'> {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const parent = inRequest.operation
        .parent as SystemEmbeddedCollectionsDocument;
    const collection = parent.getEmbeddedCollection(
        documentType,
    ) as AnyEmbeddedCollection;
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
                        [SYSTEM_EMBEDDED_COLLECTIONS_KEYS]: {
                            [collectionName]: [
                                ...collection.toObject(),
                                ...(inRequest.action === 'create'
                                    ? (
                                          inRequest as foundry.abstract.types.DocumentSocketRequest<'create'>
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

function transformCreateRequest(
    inRequest: foundry.abstract.types.DocumentSocketRequest<'create'>,
): foundry.abstract.types.DocumentSocketRequest<'update'> {
    inRequest.operation.data = inRequest.operation.data
        .filter((data) => !!data)
        .map((data: any) => {
            if (data instanceof foundry.abstract.Document)
                data = data.toObject();

            data._id ??= foundry.utils.randomID();
            return data;
        });

    return transformRequestCommon(inRequest);
}

function transformUpdateRequest(
    inRequest: foundry.abstract.types.DocumentSocketRequest<'update'>,
): foundry.abstract.types.DocumentSocketRequest<'update'> {
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
    inRequest: foundry.abstract.types.DocumentSocketRequest<'delete'>,
): foundry.abstract.types.DocumentSocketRequest<'update'> {
    const documentType = inRequest.type as foundry.abstract.Document.Type;

    const parent = inRequest.operation.parent!;
    const collection = parent.getEmbeddedCollection(
        documentType as never,
    ) as AnyEmbeddedCollection;

    inRequest.operation.ids.forEach((id) => collection.delete(id));

    return transformRequestCommon(inRequest);
}

function transformResponse(inResult: SocketResponse): SocketResponse {
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
    inRequest: foundry.abstract.types.DocumentSocketRequest<DatabaseCRUDAction>,
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
            renderSheet: (inRequest.operation as any).renderSheet,
        },
        type: inRequest.type as foundry.abstract.Document.Type,
        result: [],
    };
}

function transformCreateUpdateResponse(
    inResult: SocketResponse,
    inRequest: foundry.abstract.types.DocumentSocketRequest<
        Exclude<DatabaseCRUDAction, 'delete'>
    >,
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
                `system.${SYSTEM_EMBEDDED_COLLECTIONS_KEYS}.${collectionName}`,
            ) as AnyObject[],
        },
    );
}

function transformDeleteResponse(
    inResult: SocketResponse,
    inRequest: foundry.abstract.types.DocumentSocketRequest<'delete'>,
): SocketResponse {
    return foundry.utils.mergeObject(
        transformResponseCommon(inResult, inRequest),
        {
            result: inRequest.operation.ids,
        },
    );
}

function hasSystemEmbeddedCollections(
    doc: foundry.abstract.Document.Any,
): doc is SystemEmbeddedCollectionsDocument;
function hasSystemEmbeddedCollections(
    doc: foundry.abstract.Document.AnyConstructor,
): doc is SystemEmbeddedCollectionsDocumentConstructor;
function hasSystemEmbeddedCollections(
    doc:
        | foundry.abstract.Document.Any
        | foundry.abstract.Document.AnyConstructor,
): boolean {
    return (
        'hasSystemEmbeddedCollections' in doc &&
        doc.hasSystemEmbeddedCollections === true
    );
}

function getDocumentClassFor(uuid: string) {
    const { documentType } = foundry.utils.parseUuid(uuid);
    if (!documentType) return null;
    return CONFIG[documentType]
        .documentClass as foundry.abstract.Document.AnyConstructor | null;
}

function getCollectionNameFor(
    parentUuid: string,
    embeddedName: foundry.abstract.Document.Type,
): string | null {
    const parentDocumentClass = getDocumentClassFor(parentUuid);
    if (!parentDocumentClass) return null;

    return parentDocumentClass.getCollectionName(embeddedName as never);
}
