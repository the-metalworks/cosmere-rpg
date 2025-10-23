const SCHEMA = () => ({
    isStackable: new foundry.data.fields.BooleanField({
        required: true,
        initial: false,
    }),
    stacks: new foundry.data.fields.NumberField({
        required: false,
        nullable: true,
        min: 0,
    }),
});

export type ActiveEffectDataSchema = ReturnType<typeof SCHEMA>;

export class ActiveEffectDataModel extends foundry.abstract.TypeDataModel<
    ActiveEffectDataSchema,
    ActiveEffect
> {
    static defineSchema() {
        return SCHEMA();
    }
}
