namespace foundry {
    namespace abstract {
        type DataSchema = {
            [key: string]: any;
        };

        interface DatabaseGetOperation {
            /**
             * A query object which identifies the set of Documents retrieved
             */
            query: Record<string, any>;

            /**
             * Return indices only instead of full Document records
             */
            index: boolean;

            /**
             * An array of field identifiers which should be indexed
             */
            indexFields: string[];

            /**
             * A compendium collection ID which contains the Documents
             * @default null
             */
            pack: string | null;

            /**
             * A parent Document within which Documents are embedded
             * @default null
             */
            parent: Document | null;

            /**
             * A parent Document UUID provided when the parent instance is unavailable
             */
            parentUuid: string | null;
        }

        interface DatabaseCreateOperation {
            /**
             * Whether the database operation is broadcast to other connected clients
             */
            broadcast: boolean;

            /**
             * An array of data objects from which to create Documents
             */
            data: object[];

            /**
             * Retain the _id values of provided data instead of generating new ids
             * @default false
             */
            keepId: boolean;

            /**
             * Retain the _id values of embedded document data instead of generating new ids for each embedded document
             * @default true
             */
            keepEmbeddedIds: boolean;

            /**
             * The timestamp when the operation was performed
             */
            modifiedTime: number;

            /**
             * Block the dispatch of hooks related to this operation
             * @default false
             */
            noHook: boolean;

            /**
             * Re-render Applications whose display depends on the created Documents
             * @default true
             */
            render: boolean;

            /**
             * Render the sheet Application for any created Documents
             * @default false
             */
            renderSheet: boolean;

            /**
             * A parent Document within which Documents are embedded
             * @default null
             */
            parent: Document | null;

            /**
             * A compendium collection ID which contains the Documents
             */
            pack: string | null;

            /**
             * A parent Document UUID provided when the parent instance is unavailable
             */
            parentUuid: string | null;

            /**
             * An alias for 'data' used internally by the server-side backend
             */
            _result: (string | object)[];
        }

        interface DatabaseUpdateOperation {
            /**
             * Whether the database operation is broadcast to other connected clients
             */
            broadcast: boolean;

            /**
             * An array of data objects used to update existing Documents.
             * Each update object must contain the _id of the target Document
             */
            updates: object[];

            /**
             * Difference each update object against current Document data and only use
             * differential data for the update operation
             * @default true
             */
            diff: boolean;

            /**
             * The timestamp when the operation was performed
             */
            modifiedTime: number;

            /**
             * Merge objects recursively. If false, inner objects will be replaced
             * explicitly. Use with caution!
             * @default true
             */
            recursive: boolean;

            /**
             * Re-render Applications whose display depends on the created Documents
             * @default true
             */
            render: boolean;

            /**
             * Block the dispatch of hooks related to this operation
             * @default false
             */
            noHook: boolean;

            /**
             * A parent Document within which Documents are embedded
             * @default null
             */
            parent: Document | null;

            /**
             * A compendium collection ID which contains the Documents
             */
            pack: string | null;

            /**
             * A parent Document UUID provided when the parent instance is unavailable
             */
            parentUuid: string | null;

            /**
             * An alias for 'data' used internally by the server-side backend
             */
            _result: (string | object)[];
        }

        interface DatabaseDeleteOperation {
            /**
             * Whether the database operation is broadcast to other connected clients
             */
            broadcast: boolean;

            /**
             * An array of Document ids which should be deleted
             */
            ids: string[];

            /**
             * Delete all documents in the Collection, regardless of _id
             * @default false
             */
            deleteAll: boolean;

            /**
             * The timestamp when the operation was performed
             */
            modifiedTime: number;

            /**
             * Block the dispatch of hooks related to this operation
             * @default false
             */
            noHook: boolean;

            /**
             * Re-render Applications whose display depends on the created Documents
             * @default true
             */
            render: boolean;

            /**
             * Render the sheet Application for any created Documents
             * @default false
             */
            renderSheet: boolean;

            /**
             * A parent Document within which Documents are embedded
             * @default null
             */
            parent: Document | null;

            /**
             * A compendium collection ID which contains the Documents
             */
            pack: string | null;

            /**
             * A parent Document UUID provided when the parent instance is unavailable
             */
            parentUuid: string | null;

            /**
             * An alias for 'data' used internally by the server-side backend
             */
            _result: (string | object)[];
        }

        interface DocumentMetadata {
            name: string;
            collection: string;
            indexed: boolean;
            compendiumIndexFields: string[];
            label: string;
            coreTypes: string[];
            embedded: Record<string, string>;
            permissions: {
                create: string;
                update: string;
                delete: string;
            };
            preserveOnImport: string[];
            schemaVersion: string;
        }

        abstract class Document<
            Schema extends DataSchema = DataSchema,
            Parent extends Document | null = Document | null,
        > extends DataModel<DataSchema, Parent> {
            static metadata: DocumentMetadata;

            readonly system: Schema;
            readonly _stats: {
                systemId: string | null;
                systemVersion: string | null;
            };

            get flags(): Record<string, any>;
            get pack(): string | undefined;
            get compendium(): CompendiumCollection<Document> | undefined;
            get ownership(): Record<
                string,
                foundry.CONST.DOCUMENT_OWNERSHIP_LEVELS
            >;

            /**
             * The canonical name of this Document type, for example "Actor".
             */
            static get documentName(): string;

            /**
             * The canonical name of this Document type, for example "Actor".
             */
            get documentName(): string;

            /**
             * The allowed types which may exist for this Document class.
             */
            static get TYPES(): string[];

            /**
             * Does this Document support additional subtypes?
             */
            static get hasTypeData(): boolean;

            /* --- Model properties --- */

            /**
             * Test whether this Document is embedded within a parent Document
             */
            get isEmbedded(): boolean;

            /**
             * A Universally Unique Identifier (uuid) for this Document instance.
             */
            get uuid(): string;

            get id(): string;

            /* --- Model permissions --- */

            /**
             * Test whether a given User has a sufficient role in order to create Documents of this type in general.
             * @param user The User being tested
             * @returns Does the User have a sufficient role to create?
             */
            static canUserCreate(user: foundry.documents.BaseUser): boolean;

            /**
             * Get the explicit permission level that a User has over this Document, a value in CONST.DOCUMENT_OWNERSHIP_LEVELS.
             * This method returns the value recorded in Document ownership, regardless of the User's role.
             * To test whether a user has a certain capability over the document, testUserPermission should be used.
             * @param user The User being tested. Defaults to `game.user`.
             * @returns  A numeric permission level from CONST.DOCUMENT_OWNERSHIP_LEVELS or null
             */
            getUserLevel(user?: foundry.documents.BaseUser): number | null;

            /**
             * Test whether a certain User has a requested permission level (or greater) over the Document
             * @param user The User being tested
             * @param permission The permission level from DOCUMENT_OWNERSHIP_LEVELS to test
             * @param options Additional options involved in the permission test
             * @returns Does the user have this permission level over the Document?
             */
            testUserPermission(
                user: foundry.documents.BaseUser,
                permission: string | number,
                options?: { exact?: boolean },
            ): boolean;

            /**
             * Test whether a given User has permission to perform some action on this Document
             * @param user The User attempting modification
             * @param action The attempted action
             * @param data Data involved in the attempted action
             * @returns Does the User have permission?
             */
            canUserModify(
                user: foundry.documents.BaseUser,
                action: string,
                data: object,
            ): boolean;

            /* --- Database operations --- */

            /**
             * Create a new Document using provided input data, saving it to the database.
             * @param data Initial data used to create this Document, or a Document instance to persist.
             * @param operation Parameters of the creation operation
             * @returns The created Document instance
             *
             * @example Create a World-level Item
             * ```js
             * const data = [{name: "Special Sword", type: "weapon"}];
             * const created = await Item.create(data);
             * ```
             *
             * @example Create an Actor-owned Item
             * ```js
             * const data = [{name: "Special Sword", type: "weapon"}];
             * const actor = game.actors.getName("My Hero");
             * const created = await Item.create(data, {parent: actor});
             * ```
             *
             * @example Create an Item in a Compendium pack
             * ```js
             * const data = [{name: "Special Sword", type: "weapon"}];
             * const created = await Item.create(data, {pack: "mymodule.mypack"});
             * ```
             */
            static async create(
                data: object | Document,
                operation?: Partial<
                    Omit<DatabaseCreateOperation, 'data' | '_result'>
                >,
            ): Promise<Document>;

            /**
             * Update this Document using incremental data, saving it to the database.
             * @param data Differential update data which modifies the existing values of this document
             * @param operation Parameters of the update operation
             * @returns The updated Document instance
             */
            async update(
                data?: object,
                operation?: Partial<
                    Omit<DatabaseUpdateOperation, 'updates' | '_result'>
                >,
            ): Promise<Document>;

            /**
             * Delete this Document, removing it from the database.
             * @param operation Parameters of the deletion operation
             * @returns The deleted Document instance
             */
            async delete(
                operation?: Partial<
                    Omit<DatabaseDeleteOperation, 'ids' | '_result'>
                >,
            ): Promise<Document>;

            /**
             * Get a World-level Document of this type by its id.
             * @param documentId The Document ID
             * @param operation Parameters of the get operation
             * @returns The retrieved Document, or null
             */
            static get(
                documentId: string,
                operation?: DatabaseGetOperation,
            ): Document | null;

            /* --- Embedded operations --- */

            /**
             * A compatibility method that returns the appropriate name of an embedded collection within this Document.
             * @param name An existing collection name or a document name.
             * @returns  The provided collection name if it exists, the first available collection for the
             *           document name provided, or null if no appropriate embedded collection could be found.
             *
             * @example Passing an existing collection name.
             * ```js
             * Actor.getCollectionName("items");
             * // returns "items"
             * ```
             *
             * @example Passing a document name.
             * ```js
             * Actor.getCollectionName("Item");
             * // returns "items"
             * ```
             */
            static getCollectionName(name: string): string | null;

            /**
             * Obtain a reference to the Array of source data within the data object for a certain embedded Document name
             * @param embeddedName The name of the embedded Document type
             * @returns The Collection instance of embedded Documents of the requested type
             */
            getEmbeddedCollection(embeddedName: string): DocumentCollection;

            /**
             * Get an embedded document by its id from a named collection in the parent document.
             * @param embeddedName The name of the embedded Document type
             * @param id The id of the child document to retrieve
             * @param options Additional options which modify how embedded documents are retrieved
             * @returns The retrieved embedded Document instance, or undefined
             * @throws If the embedded collection does not exist, or if strict is true and the Embedded Document could not be found.
             */
            getEmbeddedDocument(
                embeddedName: string,
                id: string,
                options?: { strict?: boolean; invalid?: boolean },
            ): Document | undefined;

            /**
             * Create multiple embedded Document instances within this parent Document using provided input data.
             * @param embeddedName The name of the embedded Document type
             * @param data An array of data objects used to create multiple documents
             * @param opertion Parameters of the database creation workflow
             * @returns An array of created Document instances
             */
            async createEmbeddedDocuments(
                embeddedName: string,
                data: object[],
                opertion?: Partial<DatabaseCreateOperation>,
            ): Promise<Document[]>;

            /**
             * Update multiple embedded Document instances within a parent Document using provided differential data.
             * @param embeddedName The name of the embedded Document type
             * @param updates An array of differential data objects, each used to update a single Document
             * @param opertion Parameters of the database update workflow
             * @returns An array of updated Document instances
             */
            async updateEmbeddedDocuments(
                embeddedName: string,
                updates: object[],
                operation?: Partial<DatabaseUpdateOperation>,
            ): Promise<Document[]>;

            /**
             * Delete multiple embedded Document instances within a parent Document using provided string ids.
             * @param embeddedName The name of the embedded Document type
             * @param ids An array of string ids for each Document to be deleted
             * @param operation Parameters of the database deletion workflow
             * @returns An array of deleted Document instances
             */
            async deleteEmbeddedDocuments(
                embeddedName: string,
                ids: string[],
                operation?: Partial<DatabaseDeleteOperation>,
            ): Promise<Document[]>;

            /* --- Flag operations --- */

            /**
             * Get the value of a "flag" for this document
             * See the setFlag method for more details on flags
             * @param scope The flag scope which namespaces the key
             * @param key The flag key
             */
            getFlag<T extends any>(scope: string, key: string): T | undefined;

            /**
             * Assign a "flag" to this document.
             * Flags represent key-value type data which can be used to store flexible or arbitrary data required by either
             * the core software, game systems, or user-created modules.
             *
             * Each flag should be set using a scope which provides a namespace for the flag to help prevent collisions.
             *
             * Flags set by the core software use the "core" scope.
             * Flags set by game systems or modules should use the canonical name attribute for the module
             * Flags set by an individual world should "world" as the scope.
             *
             * Flag values can assume almost any data type. Setting a flag value to null will delete that flag.
             *
             * @param scope The flag scope which namespaces the key
             * @param key The flag key
             * @param value The flag value
             * @returns A Promise resolving to the updated document
             */
            async setFlag<T extends any>(
                scope: string,
                key: string,
                value: T,
            ): Promise<Document>;

            /**
             * Remove a flag assigned to the document
             * @param scope The flag scope which namespaces the key
             * @param key The flag key
             * @returns The updated document instance
             */
            async unsetFlag(scope: string, key: string): Promise<Document>;

            /* --- Database Creation Operations --- */

            /**
             * Pre-process a creation operation for a single Document instance. Pre-operation events only occur for the client
             * which requested the operation.
             *
             * Modifications to the pending Document instance must be performed using {@link Document#updateSource}.
             *
             * @param data                          The initial data object provided to the document creation request
             * @param options                       Additional options which modify the creation request
             * @param user                          The User requesting the document creation
             *                                      Return false to exclude this Document from the creation operation
             * @internal
             */
            async _preCreate(
                data: object,
                options: object,
                user: documents.BaseUser,
            ): Promise<boolean | void>;

            /**
             * Post-process a creation operation for a single Document instance. Post-operation events occur for all connected
             * clients.
             *
             * @param data                          The initial data object provided to the document creation request
             * @param options                       Additional options which modify the creation request
             * @param userId                        The id of the User requesting the document update
             * @internal
             */
            _onCreate(data: object, options: object, userId: string): void;

            /**
             * Pre-process a creation operation, potentially altering its instructions or input data. Pre-operation events only
             * occur for the client which requested the operation.
             *
             * This batch-wise workflow occurs after individual {@link Document#_preCreate} workflows and provides a final
             * pre-flight check before a database operation occurs.
             *
             * Modifications to pending documents must mutate the documents array or alter individual document instances using
             * {@link Document#updateSource}.
             *
             * @param documents                     Pending document instances to be created
             * @param operation                     Parameters of the database creation operation
             * @param user                          The User requesting the creation operation
             * @returns                             Return false to cancel the creation operation entirely
             * @internal
             */
            static async _preCreateOperation(
                documents: Document[],
                operation: DatabaseCreateOperation,
                user: documents.BaseUser,
            ): Promise<boolean | void>;

            /**
             * Post-process a creation operation, reacting to database changes which have occurred. Post-operation events occur
             * for all connected clients.
             *
             * This batch-wise workflow occurs after individual {@link Document#_onCreate} workflows.
             *
             * @param documents                     The Document instances which were created
             * @param operation                     Parameters of the database creation operation
             * @param user                          The User who performed the creation operation
             * @internal
             */
            static async _onCreateOperation(
                documents: Document[],
                operation: DatabaseCreateOperation,
                user: documents.BaseUser,
            ): Promise<void>;

            /* --- Database Update Operations --- */

            /**
             * Pre-process an update operation for a single Document instance. Pre-operation events only occur for the client
             * which requested the operation.
             *
             * @param changes                       The candidate changes to the Document
             * @param options                       Additional options which modify the update request
             * @param user                          The User requesting the document update
             * @returns                             A return value of false indicates the update operation should be cancelled.
             * @internal
             */
            async _preUpdate(
                changes: object,
                options: object,
                user: documents.BaseUser,
            ): Promise<boolean | void>;

            /**
             * Post-process an update operation for a single Document instance. Post-operation events occur for all connected
             * clients.
             *
             * @param changed                       The differential data that was changed relative to the documents prior values
             * @param options                       Additional options which modify the update request
             * @param userId                        The id of the User requesting the document update
             * @internal
             */
            _onUpdate(changed: object, options: object, userId: string);
        }

        interface DataValidationOptions {
            /**
             * Throw an error if validation fails.
             * @default true
             */
            strict?: boolean;

            /**
             * Attempt to replace invalid values with valid defaults?
             * @default false
             */
            fallback?: boolean;

            /**
             * Allow partial source data, ignoring absent fields?
             * @default false
             */
            partial?: boolean;

            /**
             * If true, invalid embedded documents will emit a warning and be
             * placed in the invalidDocuments collection rather than causing the
             * parent to be considered invalid.
             */
            dropInvalidEmbedded?: boolean;
        }

        interface DataModelValidationOptions {
            /**
             * A specific set of proposed changes to validate, rather than the full source data of the model.
             */
            changes?: object;

            /**
             * If changes are provided, attempt to clean the changes before validating them?
             * @default false
             */
            clean?: boolean;

            /**
             * Allow replacement of invalid values with valid defaults?
             * @default false
             */
            fallback?: boolean;

            /**
             * If true, invalid embedded documents will emit a warning and
             * be placed in the invalidDocuments collection rather than
             * causing the parent to be considered invalid.
             */
            dropInvalidEmbedded?: boolean;

            /**
             * Throw if an invalid value is encountered, otherwise log a warning?
             * @default true
             */
            strict?: boolean;

            /**
             * Perform validation on individual fields?
             * @default true
             */
            fields?: boolean;

            /**
             * Perform joint validation on the full data model?
             * Joint validation will be performed by default if no changes are passed.
             * Joint validation will be disabled by default if changes are passed.
             * Joint validation can be performed on a complete set of changes (for
             * example testing a complete data model) by explicitly passing true.
             */
            joint?: boolean;
        }

        declare const DynamicClass: new <_Computed extends object>(
            ...args: any[]
        ) => _Computed;

        // @ts-expect-error - This is a workaround to allow for dynamic top level properties in a class.
        declare class _InternalDataModel<
            Schema extends DataSchema,
            // Do not inline. Being a type parameter is an important part of the circumvention of TypeScript's detection of dynamic classes.
            _Computed extends object = Schema,
        > extends DynamicClass<_Computed> {}

        declare class DataModel<
            Schema extends DataSchema = DataSchema,
            Parent extends Document | null = Document | null,
        > extends _InternalDataModel<Schema> {
            /**
             * Configure the data model instance before validation and initialization workflows are performed.
             */
            public _configure(options = {});

            /**
             * The source data object for this DataModel instance.
             * Once constructed, the source object is sealed such that no keys may be added nor removed.
             */
            _source: object;

            /**
             * The defined and cached Data Schema for all instances of this DataModel.
             */
            static _schema: foundry.data.fields.SchemaField;

            /**
             * An immutable reverse-reference to a parent DataModel to which this model belongs.
             */
            readonly parent: Parent;

            /**
             * Define the data schema for documents of this type.
             * The schema is populated the first time it is accessed and cached for future reuse.
             * @virtual
             */
            static defineSchema(): foundry.data.fields.DataSchema {}

            /**
             * The Data Schema for all instances of this DataModel.
             */
            static readonly schema: foundry.data.fields.SchemaField;

            /**
             * Define the data schema for this document instance.
             */
            readonly schema: foundry.data.fields.SchemaField;

            /**
             * Is the current state of this DataModel invalid?
             * The model is invalid if there is any unresolved failure.
             */
            readonly invalid: boolean;

            /**
             * An array of validation failure instances which may have occurred when this instance was last validated.
             */
            get validationFailures(): {
                fields: foundry.data.validation.DataModelValidationFailure | null;
                joint: foundry.data.validation.DataModelValidationFailure | null;
            };

            /**
             * A set of localization prefix paths which are used by this DataModel.
             */
            static LOCALIZATION_PREFIXES: string[] = [];

            /**
             * Initialize the source data for a new DataModel instance.
             * One-time migrations and initial cleaning operations are applied to the source data.
             * @param data The candidate source data from which the model will be constructed
             * @param options Options provided to the model constructor
             * @returns Migrated and cleaned source data which will be stored to the model instance
             */
            protected _initializeSource(
                data: object | DataModel,
                options?: object,
            ): object;

            /**
             * Clean a data source object to conform to a specific provided schema.
             * @param source The source data object
             * @param options Additional options which are passed to field cleaning methods
             * @returns The cleaned source data
             */
            static cleanData(source?: object, options?: object): object;

            /**
             * Initialize the instance by copying data from the source object to instance attributes.
             * This mirrors the workflow of SchemaField#initialize but with some added functionality.
             * @param options Options provided to the model constructor
             */
            protected _initialize(options?: object);

            /**
             * Reset the state of this data instance back to mirror the contained source data, erasing any changes.
             */
            reset();

            /**
             * Clone a model, creating a new data model by combining current data with provided overrides.
             * @param data Additional data which overrides current document data at the time of creation
             * @param context Context options passed to the data model constructor
             * @returns The cloned Document instance
             */
            clone(data?: object, context?: object): this | Promise<this>;

            /**
             * Validate the data contained in the document to check for type and content
             * This function throws an error if data within the document is not valid
             * @param options Optional parameters which customize how validation occurs.
             */
            validate(options?: DataModelValidationOptions): boolean;

            /**
             * Evaluate joint validation rules which apply validation conditions across multiple fields of the model.
             * Field-specific validation rules should be defined as part of the DataSchema for the model.
             * This method allows for testing aggregate rules which impose requirements on the overall model.
             * @param data Candidate data for the model
             * @throws An error if a validation failure is detected
             */
            static validateJoint(data: object);

            /**
             * Update the DataModel locally by applying an object of changes to its source data.
             * The provided changes are cleaned, validated, and stored to the source data object for this model.
             * The source data is then re-initialized to apply those changes to the prepared data.
             * The method returns an object of differential changes which modified the original data.
             * @param changes New values which should be applied to the data model
             * @param options Options which determine how the new data is merged
             * @returns An object containing the changed keys and values
             */
            updateSource(changes?: object, options?: object): object;

            _validateModel(changes: object, options?: object);

            /**
             * Copy and transform the DataModel into a plain object.
             * Draw the values of the extracted object from the data source (by default) otherwise from its transformed values.
             * @param source Draw values from the underlying data source rather than transformed values - defaults to true
             * @returns The extracted primitive object
             */
            toObject(source?: boolean): object;

            /**
             * Extract the source data for the DataModel into a simple object format that can be serialized.
             * @returns The document source data expressed as a plain object
             */
            toJSON(): object;

            update(data?: object);

            /**
             * Prepare data for the Document. This method is called automatically by the DataModel#_initialize workflow.
             * This method provides an opportunity for Document classes to define special data preparation logic.
             * The work done by this method should be idempotent. There are situations in which prepareData may be called more
             * than once.
             * @memberof ClientDocumentMixin#
             */
            public prepareData();

            /**
             * Prepare data related to this Document itself, before any embedded Documents or derived data is computed.
             *
             * Called before {@link ClientDocument#prepareDerivedData} in {@link ClientDocument#prepareData}.
             */
            public prepareBaseData();

            /**
             * Prepare all embedded Document instances which exist within this primary Document.
             * @memberof ClientDocumentMixin#
             */
            public prepareEmbeddedDocuments();

            /**
             * Apply transformations of derivations to the values of the source data object.
             * Compute data fields whose values are not stored to the database.
             *
             * Called before {@link ClientDocument#prepareDerivedData} in {@link ClientDocument#prepareData}.
             */
            public prepareDerivedData();

            /* --- Deprecations and Compatibility --- */

            /**
             * Migrate candidate source data for this DataModel which may require initial cleaning or transformations.
             * @param source           The candidate source data from which the model will be constructed
             * @returns                Migrated source data, if necessary
             */
            static migrateData(source: object): object;
        }

        declare class TypeDataModel<
            Schema extends DataSchema = DataSchema,
            Parent extends Document | null = Document | null,
        > extends DataModel<Schema, Parent> {}
    }
}
