interface ActiveEffectData {
    /**
     * Whether the effect is cumulative.
     */
    isCumulative: boolean;

    /**
     * The number of stacked instances of this effect. Used for cumulative effects.
     */
    count?: number;
}

export class ActiveEffectDataModel extends foundry.abstract.TypeDataModel<
    ActiveEffectData,
    ActiveEffect
> {
    static defineSchema() {
        return {
            isCumulative: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
            }),
            count: new foundry.data.fields.NumberField({
                required: false,
                nullable: true,
                min: 0,
            }),
        };
    }
}
