import type { AnyObject } from '@system/types/utils';
import type { Document } from '@system/types/foundry/document';

export function SystemEmbeddableMixin<
    const SystemDocument extends Document.Constructable.AnyConstructor,
>(cls: SystemDocument) {
    return class extends cls {
        public static async createDocuments(
            data: AnyObject[] = [],
            operation: SystemEmbeddableMixin.CreateOperation = {},
        ) {
            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.createDocuments(data as never, operation as never);

            return operation.parent.createEmbeddedDocuments(
                this.documentName as never,
                data as never,
                operation as never,
            );
        }

        public static async updateDocuments(
            updates: AnyObject[] = [],
            operation: SystemEmbeddableMixin.UpdateOperation = {},
        ) {
            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.updateDocuments(
                    updates as never,
                    operation as never,
                );

            return operation.parent.updateEmbeddedDocuments(
                this.documentName as never,
                updates as never,
                operation as never,
            );
        }

        public static async deleteDocuments(
            ids: string[] = [],
            operation: SystemEmbeddableMixin.DeleteOperation = {},
        ) {
            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.deleteDocuments(ids, operation as never);

            return operation.parent.deleteEmbeddedDocuments(
                this.documentName as never,
                ids as never,
                operation as never,
            );
        }
    } as unknown as typeof cls;
}

type SystemEmbeddableMixinParent = foundry.abstract.Document<
    foundry.abstract.Document.SystemType,
    {}
> & {
    hasSystemEmbeddedCollections: boolean;

    constructor: typeof foundry.abstract.Document & {
        isNativeEmbedding(
            embeddedName: foundry.abstract.Document.Type,
        ): boolean;
    };
};

export namespace SystemEmbeddableMixin {
    export type CreateOperation =
        foundry.abstract.Document.Database.CreateOperation<foundry.abstract.types.DatabaseCreateOperation> & {
            parent?: SystemEmbeddableMixinParent;
        };

    export type UpdateOperation =
        foundry.abstract.Document.Database.UpdateOperation<foundry.abstract.types.DatabaseUpdateOperation> & {
            parent?: SystemEmbeddableMixinParent;
        };

    export type DeleteOperation =
        foundry.abstract.Document.Database.DeleteOperation<foundry.abstract.types.DatabaseDeleteOperation> & {
            parent?: SystemEmbeddableMixinParent;
        };
}
