export function PseudoEmbeddableMixin<const SystemDocument>(
    cls: SystemDocument,
) {
    // const cls = CONFIG[concreteDocumentName].documentClass;

    return class extends (cls as any) {
        public static async createDocuments(
            data: any[] = [],
            operation: any = {},
        ) {
            console.log(
                'PseudoEmbeddableMixin createDocuments called',
                data,
                operation,
            );

            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.createDocuments(data, operation);

            return operation.parent.createEmbeddedDocuments(
                this.documentName,
                data,
                operation,
            );
        }

        public static async updateDocuments(
            updates: any[] = [],
            operation: any = {},
        ) {
            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.updateDocuments(updates, operation);

            return operation.parent.updateEmbeddedDocuments(
                this.documentName,
                updates,
                operation,
            );
        }

        public static async deleteDocuments(
            ids: string[] = [],
            operation: any = {},
        ) {
            if (
                !operation.parent?.hasSystemEmbeddedCollections ||
                operation.parent.constructor.isNativeEmbedding(
                    this.documentName,
                )
            )
                return super.deleteDocuments(ids, operation);

            return operation.parent.deleteEmbeddedDocuments(
                this.documentName,
                ids,
                operation,
            );
        }
    } as unknown as typeof cls;
}

export namespace PseudoEmbeddableMixin {
    export type ConcreteDocumentType = 'Item';
}
