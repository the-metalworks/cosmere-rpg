declare namespace foundry {
    namespace data {
        namespace fields {
            type DataSchema = {
                [key: string]: DataField;
            };

            interface DataFieldValidationOptions {
                partial?: boolean;
                fallback?: boolean;
                source?: object;
                dropInvalidEmbedded?: boolean;
            }

            interface DataModelValidationFailure {}

            type DataFieldValidator = (
                value: any,
                options?: DataFieldValidationOptions,
            ) => boolean | void;

            interface DataFieldOptions {
                /**
                 * Is this field required to be populated?
                 * @default false
                 */
                required?: boolean;

                /**
                 * Can this field have null values?
                 * @default false
                 */
                nullable?: boolean;

                /**
                 * Can this field only be modified by a gamemaster or assistant gamemaster?
                 * @default false
                 */
                gmOnly?: boolean;

                /**
                 * The initial value of a field, or a function which assigns that initial value.
                 */
                initial?: function | any;

                /**
                 * A localizable label displayed on forms which render this field.
                 */
                label?: string;

                /**
                 * Localizable help text displayed on forms which render this field.
                 */
                hint?: string;

                /**
                 * A custom data field validation function.
                 */
                validate?: DataFieldValidator;

                /**
                 * A custom validation error string. When displayed will be prepended with the
                 * document name, field name, and candidate value. This error string is only
                 * used when the return type of the validate function is a boolean. If an Error
                 * is thrown in the validate function, the string message of that Error is used.
                 */
                validationError?: string;
            }

            interface DataFieldContext {
                name?: string;
                parent?: DataField;
            }

            class DataField<
                Options extends DataFieldOptions = DataFieldOptions,
            > {
                constructor(option?: Options, context?: DataFieldContext);

                /**
                 * The field name of this DataField instance.
                 * This is assigned by SchemaField#initialize.
                 * @internal
                 */
                name: string;

                /**
                 * The initially provided options which configure the data field
                 */
                options: Options;

                /**
                 * Whether this field defines part of a Document/Embedded Document hierarchy.
                 * @default false
                 */
                static hierarchical: boolean;

                /**
                 * Does this field type contain other fields in a recursive structure?
                 * Examples of recursive fields are SchemaField, ArrayField, or TypeDataField
                 * Examples of non-recursive fields are StringField, NumberField, or ObjectField
                 * @default false
                 */
                static recursive: boolean;

                /**
                 * Default parameters for this field type
                 */
                protected static get _defaults(): DataFieldOptions;

                /**
                 * A dot-separated string representation of the field path within the parent schema.
                 */
                get fieldPath(): string;

                /**
                 * Apply a function to this DataField which propagates through recursively to any contained data schema.
                 * @param fn        The function to apply
                 * @param value     The current value of this field
                 * @param options   Additional options passed to the applied function
                 */
                apply(
                    fn: string | Function,
                    value: any,
                    options?: object,
                ): object;

                /* -------------------------------------------- */
                /*  Field Cleaning                              */
                /* -------------------------------------------- */

                /**
                 * Coerce source data to ensure that it conforms to the correct data type for the field.
                 * Data coercion operations should be simple and synchronous as these are applied whenever a DataModel is constructed.
                 * For one-off cleaning of user-provided input the sanitize method should be used.
                 * @param value     The initial value
                 * @param options   Additional options for how the field is cleaned
                 */
                clean(
                    value: any,
                    options?: { partial?: boolean; source?: object },
                ): any;

                /**
                 * Apply any cleaning logic specific to this DataField type.
                 * @param value     The appropriately coerced value.
                 * @param options   Additional options for how the field is cleaned.
                 */
                protected _cleanType(value: any, options?: object): any;

                /**
                 * Attempt to retrieve a valid initial value for the DataField.
                 * @param data  The source data object for which an initial value is required
                 * @returns     A valid initial value
                 * @throws      An error if there is no valid initial value defined
                 */
                getInitialValue(data: object): any;

                /* -------------------------------------------- */
                /*  Field Validation                            */
                /* -------------------------------------------- */

                /**
                 * Validate a candidate input for this field, ensuring it meets the field requirements.
                 * A validation failure can be provided as a raised Error (with a string message), by returning false, or by returning
                 * a DataModelValidationFailure instance.
                 * A validator which returns true denotes that the result is certainly valid and further validations are unnecessary.
                 * @param value     The initial value
                 * @param options   Options which affect validation behavior
                 * @returns         Returns a DataModelValidationFailure if a validation failure
                 *                  occurred.
                 */
                validate(
                    value: any,
                    options?: DataFieldValidationOptions,
                ): DataModelValidationFailure | void;

                /**
                 * A default type-specific validator that can be overridden by child classes
                 * @param value     The candidate value
                 * @param options   Options which affect validation behavior
                 * @returns         A boolean to indicate with certainty whether the value is
                 *                  valid, or specific DataModelValidationFailure information,
                 *                  otherwise void.
                 * @throws          May throw a specific error if the value is not valid
                 */
                protected _validateType(
                    value: any,
                    options?: DataFieldValidationOptions,
                ): boolean | DataModelValidationFailure | void;

                /* -------------------------------------------- */
                /*  Initialization and Serialization            */
                /* -------------------------------------------- */

                /**
                 * Initialize the original source data into a mutable copy for the DataModel instance.
                 * @param value     The source value of the field
                 * @param model     The DataModel instance that this field belongs to
                 * @param options   Initialization options
                 * @returns         An initialized copy of the source data
                 */
                initialize(value: any, model: object, options?: object): any;

                /**
                 * Recursively traverse a schema and retrieve a field specification by a given path
                 * @param path  The field path as an array of strings
                 * @internal
                 */
                _getField(path: string[]): DataField;
            }

            class SchemaField extends DataField {
                constructor(
                    fields: DataSchema,
                    options?: DataFieldOptions,
                    context?: DataFieldContext,
                );

                fields: DataSchema;
            }

            class BooleanField extends DataField {}

            interface NumberFieldOptions extends DataFieldOptions {
                /**
                 * A minimum allowed value
                 */
                min?: number;

                /**
                 * A maximum allowed value
                 */
                max?: number;

                /**
                 * A permitted step size
                 */
                step?: number;

                /**
                 * Must the number be an integer?
                 * @default false
                 */
                integer?: boolean;

                /**
                 * Must the number be positive?
                 * @default false
                 */
                positive?: boolean;

                /**
                 * An array of values or an object of values/labels which represent
                 * allowed choices for the field. A function may be provided which dynamically
                 * returns the array of choices.
                 */
                choices?: number[] | object | function;
            }

            class NumberField extends DataField {
                constructor(
                    options?: NumberFieldOptions,
                    context?: DataFieldContext,
                );
            }

            interface StringFieldOptions extends DataFieldOptions {
                /**
                 * Is the string allowed to be blank (empty)?
                 * @default true
                 */
                blank?: boolean;

                /**
                 * Should any provided string be trimmed as part of cleaning?
                 * @default true
                 */
                trim?: boolean;

                /**
                 * An array of values or an object of values/labels which represent
                 * allowed choices for the field. A function may be provided which dynamically
                 * returns the array of choices.
                 */
                choices?: string[] | object | function;

                /**
                 * Is this string field a target for text search?
                 * @default false
                 */
                textSearch?: boolean;
            }

            class StringField extends DataField {
                constructor(
                    options?: StringFieldOptions,
                    context?: DataFieldContext,
                );

                choices: string[] | object;
            }

            class ObjectField extends DataField {}

            interface ArrayFieldOptions extends DataFieldOptions {
                /**
                 * The minimum number of elements.
                 */
                min?: number;

                /**
                 * The maximum number of elements.
                 */
                max?: number;
            }

            class ArrayField extends DataField {
                constructor(
                    element: DataField,
                    options?: ArrayFieldOptions,
                    context?: DataFieldContext,
                );
            }

            class SetField extends ArrayField {}

            class HTMLField extends StringField {}

            /**
             * A subclass of {@link ObjectField} which embeds some other DataModel definition as an inner object.
             */
            class EmbeddedDataField extends SchemaField {
                constructor(
                    model: typeof foundry.data.DataModel,
                    options?: DataFieldOptions,
                    context?: DataFieldContext,
                );
            }

            /**
             * A subclass of {@link ArrayField} which supports an embedded Document collection.
             * Invalid elements will be dropped from the collection during validation rather than failing for the field entirely.
             */
            class EmbeddedCollectionField extends ArrayField {
                constructor(
                    element: typeof foundry.abstract.Document,
                    options?: DataFieldOptions,
                    context?: DataFieldContext,
                );
            }

            /**
             * A subclass of {@link EmbeddedDataField} which supports a single embedded Document.
             */
            class EmbeddedDocumentField extends EmbeddedDataField {
                constructor(
                    model: typeof foundry.abstract.Document,
                    options?: DataFieldOptions,
                    context?: DataFieldContext,
                );
            }

            /**
             * A subclass of {@link StringField} which provides the primary _id for a Document.
             * The field may be initially null, but it must be non-null when it is saved to the database.
             */
            class DocumentIdField extends StringField {}

            interface DocumentUUIDFieldOptions extends StringFieldOptions {
                /**
                 * A specific document type in CONST.ALL_DOCUMENT_TYPES required by this field
                 */
                type?: string;

                /**
                 * Does this field require (or prohibit) embedded documents?
                 */
                embedded?: boolean;
            }

            /**
             * A subclass of {@link StringField} which supports referencing some other Document by its UUID.
             * This field may not be blank, but may be null to indicate that no UUID is referenced.
             */
            class DocumentUUIDField extends StringField {
                constructor(
                    options?: DocumentUUIDFieldOptions,
                    context?: DataFieldContext,
                );
            }
        }
    }
}
