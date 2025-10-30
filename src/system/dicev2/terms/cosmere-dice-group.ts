/* eslint-disable @typescript-eslint/class-literal-property-style */

export class CosmereDiceGroup extends foundry.dice.terms.DiceTerm {
    public constructor(protected termData: object) {
        super(termData);

        this.uuid = `cosmere:group:${foundry.utils.randomID()}`;
    }

    public readonly uuid: string;

    /* --- Accessors --- */
    public get hasAdvantage(): boolean {
        return false;
    }

    public get hasDisadvantage(): boolean {
        return false;
    }

    public get hasOpportunity(): boolean {
        return false;
    }

    public get hasComplication(): boolean {
        return false;
    }

    /* --- Functions --- */
}
