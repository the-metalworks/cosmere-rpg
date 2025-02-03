import { DamageType, Skill, Attribute } from '@system/types/cosmere';
import { CosmereActorRollData } from '@system/documents/actor';
import { AdvantageMode } from '@system/types/roll';
import RollTerm from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/dice/terms/term.mjs';

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
    damage?: {
        total: DamageRoll;
        unmodded: DamageRoll;
        dice: DamageRoll;
    };
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

    /**
     * Where did this damage come from?
     */
    source?: string;

    /**
     * Nested Roll item for graze damage
     */
    graze?: DamageRoll;

    /**
     * Indicates if the damage should be a critical
     */
    critical?: boolean;
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

    get source(): string | undefined {
        return this.options.source;
    }

    get graze(): DamageRoll | undefined {
        return this.options.graze;
    }

    set graze(roll: DamageRoll) {
        this.options.graze = roll;
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

    /**
     * Whether or not the damage roll is a critical hit
     */
    public get isCritical() {
        return this.options.critical === true;
    }

    public get hasDice() {
        return this.dice.length > 0;
    }

    /* --- Functions --- */

    public override async getTooltip(): Promise<string> {
        const tooltip = await super.getTooltip();

        if (tooltip) {
            const diceRolls = $(tooltip).find('.roll.die');
            const firstPart = $(tooltip).find('.tooltip-part').first();

            let total = 0;
            $(tooltip)
                .find('.value')
                .each((_index, value) => {
                    total += Number($(value).text());
                });

            firstPart.find('.dice-rolls').empty().append(diceRolls);
            firstPart.find('.value').text(total);

            const tooltipFinal = $(tooltip)
                .find('.dice-tooltip')
                .empty()
                .append(firstPart);

            return tooltipFinal[0].outerHTML;
        }

        // Get dice terms
        const parts = [
            {
                formula: this.formula,
                total: this.total,
                rolls: [], // There are no dice, otherwise the default tooltip would have been returned
            },
        ];

        // Render the template
        const rendered = await renderTemplate(
            foundry.dice.Roll.TOOLTIP_TEMPLATE,
            {
                parts,
            },
        );

        return rendered;
    }

    /* --- Helper Functions --- */

    public removeTermSafely(
        conditional: (
            value: RollTerm,
            index: number,
            obj: RollTerm[],
        ) => boolean,
    ) {
        this.terms.findSplice(conditional);
        this.cleanUpTerms();
    }

    public filterTermsSafely(
        condition: (value: RollTerm, index: number, obj: RollTerm[]) => boolean,
    ) {
        this.terms = this.terms.filter(condition);
        this.cleanUpTerms();
    }

    public replaceDieResults(sourceDicePool: foundry.dice.terms.DiceTerm[]) {
        sourceDicePool.forEach((die) => {
            let numDiceToAlter = die.number ?? 0;
            while (numDiceToAlter > 0) {
                const nextDie = this.dice.find(
                    (newDie) => newDie.faces === die.faces,
                );
                if (!nextDie) return;
                nextDie.results = die.results;
                numDiceToAlter--;
            }
        });
        this._total = this._evaluateTotal();
    }

    /* --- Internal Functions --- */

    private cleanUpTerms() {
        while (
            this.terms[this.terms.length - 1] instanceof
            foundry.dice.terms.OperatorTerm
        )
            this.terms.pop();
        this.resetFormula();
    }

    private configureModifiers() {
        // Find the first die term
        const dieTerm = this.terms.find(
            (term) => term instanceof foundry.dice.terms.Die,
        );

        const shouldApplyModifier = this.hasAdvantage || this.hasDisadvantage;

        if (dieTerm && shouldApplyModifier) {
            const modifier = this.hasAdvantage ? 'kh' : 'kl';

            if (dieTerm.number && dieTerm.number > 1) {
                // Remove one die from the original
                dieTerm.number -= 1;

                // Create a new term with the modifier
                const newTerm = new foundry.dice.terms.Die({
                    number: 2,
                    faces: dieTerm.faces,
                    modifiers: [modifier],
                });

                this.terms.push(
                    new foundry.dice.terms.OperatorTerm({
                        operator: '+',
                    }),
                    newTerm,
                );
            } else if (dieTerm.number === 1) {
                dieTerm.number = 2;
                dieTerm.modifiers.push(modifier);
            }
        }

        // Re-compile the underlying formula
        this._formula = Roll.getFormula(this.terms);

        // Mark as configured
        this.options.configured = true;
    }
}
