export type InferOptions<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<infer TOptions> ? TOptions : never;

export type InferAssignmentType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, infer TAssignmentType> ? TAssignmentType
    : never;

export type InferInitializedType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, any, infer TInitializedType> ? TInitializedType
    : never;

export type InferPersistedType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, any, any, infer TPersistedType> ? TPersistedType
    : never;

export type InferSchema<TField extends foundry.data.fields.SchemaField.Any> =
    TField extends foundry.data.fields.SchemaField<infer U> ? U : never;

export type DataSchemaInitializedType<TSchema extends foundry.data.fields.DataSchema | undefined> = 
    TSchema extends foundry.data.fields.DataSchema
        ? foundry.data.fields.SchemaField.InitializedData<TSchema>
        : {};