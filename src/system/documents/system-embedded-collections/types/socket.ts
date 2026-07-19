export type DatabaseCRUDAction = Exclude<
    foundry.abstract.types.DatabaseAction,
    'get'
>;

export interface DocumentSocketRequest<
    DatabaseAction extends
        foundry.abstract.types.DatabaseAction = foundry.abstract.types.DatabaseAction,
> extends foundry.abstract.types.DocumentSocketRequest<DatabaseAction> {
    type: foundry.abstract.Document.Type;
    operation: foundry.abstract.types.DocumentSocketRequest<DatabaseAction>['operation'] & {
        id: string;
        action: DatabaseAction;
        queue?: boolean;
    };
}

export interface SocketResponse
    extends Omit<foundry.helpers.SocketInterface.SocketResponse, 'request'> {
    action: foundry.abstract.types.DatabaseAction;
    broadcast?: boolean;
    operation: Omit<
        foundry.abstract.types.DatabaseOperation,
        'data' | 'updates' | 'ids'
    > & {
        id: string;
        action: foundry.abstract.types.DatabaseAction;
        modifiedTime: number;
        render?: boolean;
        renderSheet?: boolean;
        diff?: boolean;
        recursive?: boolean;
        isSystemEmbeddedCollectionOperation?: boolean;
        sourceRequest?: DocumentSocketRequest;
        targets?: { id: string; uuid: string }[];
        hierarchy?: {
            documentName: foundry.abstract.Document.Type;
            id: string;
        }[];
        queue?: boolean;
    };
    type: foundry.abstract.Document.Type;
}
