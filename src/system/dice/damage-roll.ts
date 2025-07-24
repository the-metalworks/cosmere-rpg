import { DamageType, Skill, Attribute } from '@system/types/cosmere';
import { CosmereActorRollData } from '@system/documents/actor';
import { AdvantageMode } from '@system/types/roll';

export type DamageRollData<
    ActorRollData extends CosmereActorRollData = CosmereActorRollData,
> = {
    [K in keyof ActorRollData]: ActorRollData[K];
} & {
    mod?: number;
    skill?: {
        id: Skill;
        rank: number;
        mod: number;
        attribute: Attribute;
    };
    attribute?: number;
};

export interface DamageRollOptions
    extends Partial<foundry.dice.terms.RollTerm.EvaluationOptions> {
    /**
     * The type of damage being rolled
     */
    damageType?: DamageType;

    /**
     * The damage modifier to apply on hit
     */
    mod?: number;

    /**
     * What advantage modifier to apply to the damage roll
     * @default AdvantageMode.None
     */
    advantageMode?: AdvantageMode;
}

export class DamageRoll extends foundry.dice.Roll<DamageRollData> {
    declare options: DamageRollOptions & { configured: boolean };

    public readonly isDamage = true;

    public constructor(
        formula: string,
        data: DamageRollData,
        options: DamageRollOptions,
    ) {
        super(formula, data, options);

        if (!this.options.configured) {
            this.configureModifiers();
        }
    }

    get damageType(): DamageType | undefined {
        return this.options.damageType;
    }

    get mod(): number | undefined {
        return this.options.mod;
    }

    public get hasMod() {
        return this.options.mod !== undefined;
    }

    /**
     * Whether or not the damage roll has advantage
     */
    public get hasAdvantage() {
        return this.options.advantageMode === AdvantageMode.Advantage;
    }

    /**
     * Whether or not the damage roll has disadvantage
     */
    public get hasDisadvantage() {
        return this.options.advantageMode === AdvantageMode.Disadvantage;
    }

    /* --- Internal Functions --- */

    private configureModifiers() {
        // Find the first die term
        const dieTerm = this.terms.find(
            (term) => term instanceof foundry.dice.terms.Die,
        );

        const shouldApplyModifier = this.hasAdvantage || this.hasDisadvantage;

        if (dieTerm && shouldApplyModifier) {
            const modifier = this.hasAdvantage ? 'kh' : 'kl';

            if (dieTerm.number && dieTerm.number > 1) {
                const newTerm = new foundry.dice.terms.Die({
                    number: 1,
                    faces: dieTerm.faces,
                    modifiers: [modifier],
                });

                this.terms.push(newTerm);
            } else if (dieTerm.number === 1) {
                dieTerm.modifiers.push(modifier);
            }
        }

        // Re-compile the underlying formula
        this._formula = Roll.getFormula(this.terms);

        // Mark as configured
        this.options.configured = true;
    }
}
