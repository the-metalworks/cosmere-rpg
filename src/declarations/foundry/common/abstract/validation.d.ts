declare namespace foundry {
    namespace data {
        namespace validation {
            namespace DataModelValidationFailure {
                interface Config {
                    /**
                     * The value that failed validation for this field.
                     */
                    invalidValue?: any;

                    /**
                     * The value it was replaced by, if any.
                     */
                    fallback?: any;

                    /**
                     * Whether the value was dropped from some parent collection.
                     * @default true
                     */
                    dropped?: boolean;

                    /**
                     * The validation error message.
                     */
                    message?: string;

                    /**
                     * Whether this failure was unresolved
                     * @default false
                     */
                    unresolved?: boolean;
                }

                interface ElementValidationFailure {
                    /**
                     * Either the element's index or some other identifier for it.
                     */
                    id: string | number;

                    /**
                     * Optionally a user-friendly name for the element.
                     */
                    name?: string;

                    /**
                     * The element's validation failure.
                     */
                    failure: DataModelValidationFailure;
                }
            }

            class DataModelValidationFailure {
                /**
                 * The value that failed validation for this field.
                 */
                public invalidValue?: any;

                /**
                 * The value it was replaced by, if any.
                 */
                public fallback?: any;

                /**
                 * Whether the value was dropped from some parent collection.
                 * @defaultValue true
                 */
                public dropped?: boolean;

                /**
                 * The validation error message.
                 */
                public message?: string;

                /**
                 * If this field contains other fields that are validated
                 * as part of its validation, their results are recorded here.
                 */
                public fields: Record<string, DataModelValidationFailure>;

                /**
                 * If this field contains a list of elements that are validated
                 * as part of its validation, their results are recorded here.
                 */
                public elements: ElementValidationFailure[];

                constructor(config?: DataModelValidationFailure.Config);
            }

            class DataModelValidationError extends Error {
                constructor(errors: Record<string, any>);
            }
        }
    }
}
