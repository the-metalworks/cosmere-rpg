interface ActiveEffectData {
    /**
     * Whether the effect can stack be stacked.
     */
    isStackable: boolean;

    /**
     * The number of stacked instances of this effect. Used for stackable effects.
     */
    stacks?: number;
}

export class ActiveEffectDataModel extends foundry.abstract.TypeDataModel<
    ActiveEffectData,
    ActiveEffect
> {
    static defineSchema() {
        return {
            isStackable: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
            }),
            stacks: new foundry.data.fields.NumberField({
                required: false,
                nullable: true,
                min: 0,
            }),
        };
    }
}
