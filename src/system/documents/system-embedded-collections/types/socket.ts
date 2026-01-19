export type DatabaseCRUDAction = Exclude<
    foundry.abstract.types.DatabaseAction,
    'get'
>;

export type DocumentSocketRequest<
    DatabaseAction extends
        foundry.abstract.types.DatabaseAction = foundry.abstract.types.DatabaseAction,
> = foundry.abstract.types.DocumentSocketRequest<DatabaseAction>;

export interface SocketResponse
    extends Omit<foundry.helpers.SocketInterface.SocketResponse, 'request'> {
    action: foundry.abstract.types.DatabaseAction;
    broadcast?: boolean;
    operation: Omit<
        foundry.abstract.types.DatabaseOperation,
        'data' | 'updates' | 'ids'
    > & {
        action: foundry.abstract.types.DatabaseAction;
        modifiedTime: number;
        render?: boolean;
        renderSheet?: boolean;
        isSystemEmbeddedCollectionOperation?: boolean;
        sourceRequest?: DocumentSocketRequest;
    };
    type: foundry.abstract.Document.Type;
}
