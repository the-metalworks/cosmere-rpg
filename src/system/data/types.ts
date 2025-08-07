export type InferAssignmentType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, infer TAssignmentType> ? TAssignmentType
    : never;

export type InferInitializedType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, any, infer TInitializedType> ? TInitializedType
    : never;

export type InferPersistedType<TField extends foundry.data.fields.DataField.Any> =
    TField extends foundry.data.fields.DataField<any, any, any, infer TPersistedType> ? TPersistedType
    : never;