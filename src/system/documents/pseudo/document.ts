// type

export function PseudoDocument<
    const ConcreteDocumentName extends foundry.abstract.Document.Type,
    const TSchema extends
        PseudoDocument.Schema = (typeof concreteDocument)['schema']['fields'],
    const TMetadata extends
        PseudoDocument.Metadata<ConcreteDocumentName> = PseudoDocument.Metadata<ConcreteDocumentName>,
>(concreteDocumentName: ConcreteDocumentName) {
    const concreteDocument = CONFIG[concreteDocumentName].documentClass;

    const documentName =
        `Pseudo${concreteDocumentName}` as PseudoDocument.Type<ConcreteDocumentName>;

    return class<
        const ParentDoc extends PseudoDocument.ParentDocument,
    > extends foundry.abstract.DataModel<
        TSchema,
        PseudoDocument.Parent<ParentDoc>
    > {
        constructor(
            ...[data, options]: PseudoDocument.ConstructorArgs<
                TSchema,
                ParentDoc
            >
        ) {
            super(data, {
                ...options,
                parent: options.parent
                    .system as PseudoDocument.Parent<ParentDoc>,
            });
        }

        /* --- Static properties --- */

        public static metadata = Object.freeze({
            name: documentName,
            label: `DOCUMENT.COSMERE.Pseudo${concreteDocumentName}`,
            schemaVersion: concreteDocument.metadata.schemaVersion,
        }) as TMetadata;

        public static get documentName() {
            return this.metadata.name;
        }

        /* --- Instance properties --- */

        public readonly isEmbedded = true; // Pseudo-documents are always embedded

        public get id() {
            return this._id;
        }

        public get documentName() {
            return documentName;
        }

        public get uuid(): string {
            return `${this.parentDocument.uuid}.${this.documentName}.${this.id}`;
        }

        public get parentDocument(): ParentDoc {
            return this.parent.parent;
        }

        /* --- Operation functions --- */

        public async update(
            data: PseudoDocument.UpdateData<Schema> | undefined,
            operation?: PseudoDocument.Database.UpdateOperation<
                Schema,
                Metadata
            >,
        ) {
            const result = await this.parentDocument.update({
                system: {
                    // pseudoCollections: {
                    //     [this.documentName]: {
                    //         ...data,
                    //         _id: this.id,
                    //         id: this.id,
                    //     }
                    // }
                },
            });

            return result;
        }
    };
}

export type PseudoDocument<
    ConcreteDocumentName extends foundry.abstract.Document.Type,
> = InstanceType<ReturnType<typeof PseudoDocument<ConcreteDocumentName>>>;

export namespace PseudoDocument {
    export type Any = PseudoDocument<
        PseudoDocument.Type,
        PseudoDocument.Schema,
        PseudoDocument.ParentDocument,
        PseudoDocument.Metadata.Any
    >;

    export type Type<
        DocumentName extends foundry.abstract.Document.Type | 'Document',
    > = `Pseudo${DocumentName}`;

    export type UpdateData<Schema extends PseudoDocument.Schema> =
        foundry.data.fields.SchemaField.UpdateData<Schema>;
    export type ParentUpdateData<
        Schema extends PseudoDocument.Schema,
        Metadata extends PseudoDocument.Metadata.Any,
    > = {
        system: {
            pseudoCollections: {
                [K in Metadata['name']]: PseudoDocument.UpdateData<Schema>;
            };
        };
    };

    export type ParentDocument = foundry.documents.Item;
    export type Parent<Doc extends ParentDocument> =
        Doc['system'] extends foundry.abstract.DataModel.Any
            ? Doc['system']
            : foundry.abstract.DataModel.Any;

    export interface ConstructionContext<
        ParentDoc extends PseudoDocument.ParentDocument,
    > extends foundry.abstract.DataModel.ConstructionContext {
        parent: ParentDoc;
    }

    export type ConstructorArgs<
        Schema extends PseudoDocument.Schema,
        ParentDoc extends PseudoDocument.ParentDocument,
    > = [
        data: foundry.abstract.DataModel.CreateData<Schema>,
        options: ConstructionContext<ParentDoc>,
    ];

    export interface Schema<
        ConcreteDocumentName extends
            foundry.abstract.Document.Type = foundry.abstract.Document.Type,
    > extends foundry.data.fields.DataSchema {
        _id: foundry.data.fields.DocumentIdField;
    }

    export type Metadata<
        ConcreteDocumentName extends foundry.abstract.Document.Type,
    > = {
        readonly name: PseudoDocument.Type<ConcreteDocumentName>;
        readonly label: string;
        readonly schemaVersion: string;
    };

    export namespace Metadata {
        export type Any = Metadata<foundry.abstract.Document.Type>;
    }

    export namespace Database {
        export type Update<
            Schema extends PseudoDocument.Schema,
            Metadata extends PseudoDocument.Metadata.Any,
        > = foundry.abstract.types.DatabaseUpdateOperation<
            PseudoDocument.ParentUpdateData<Schema, Metadata>
        >;

        export type UpdateOperation<
            Schema extends PseudoDocument.Schema,
            Metadata extends PseudoDocument.Metadata.Any,
        > = foundry.abstract.Document.Database.UpdateOperation<
            Update<Schema, Metadata>
        >;
    }
}

// type Documentlike<
//     Schema extends foundry.data.fields.DataSchema,
//     Metadata extends DocumentlikeMetadata = DocumentlikeMetadata
// > = Pick<
//     foundry.abstract.Document<foundry.abstract.Document.Type, Schema>,
//     '_id'
// > & {
//     type: string;
//     documentName: Metadata['name'];

//     update: (data: any, operation?: any) => Promise<Documentlike<Schema, Metadata> | undefined>;
// } & {
//     new(...args: any[]): any;
//     metadata: Metadata;
// }
