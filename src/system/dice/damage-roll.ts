import { DamageType } from '@system/types/cosmere';
import { AdvantageMode } from '@system/types/roll';

import { EmptyObject } from '@system/types/utils';

export interface DamageRollOptions
    extends Partial<foundry.dice.terms.RollTerm.EvaluationOptions> {
    /**
     * The type of damage being rolled
     */
    damageType?: DamageType;

    /**
     * The damage modifier to apply on hit
     */
    mod: number;

    /**
     * What advantage modifier to apply to the damage roll
     * @default AdvantageMode.None
     */
    advantageMode?: AdvantageMode;
}

export class DamageRoll extends foundry.dice.Roll<EmptyObject> {
    public readonly isDamage = true;

    declare options: DamageRollOptions;

    public constructor(formula: string, options: DamageRollOptions) {
        super(formula, {}, options);
    }

    get damageType(): DamageType | undefined {
        return this.options.damageType;
    }

    get mod(): number {
        return this.options.mod;
    }
}
