/* eslint-disable @typescript-eslint/class-literal-property-style */
import { Attribute, Skill } from '@system/types/cosmere';
import {
    AdvantageMode,
    DieModifier,
    RollEvaluationOptions,
    RollMode,
    RollType,
} from '../types';
import {
    FixedInstanceType,
    InexactPartial,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';

// Documents
import {
    CosmereActor,
    CosmereChatMessage,
    CosmereItem,
} from '@system/documents';

// Data
import { ActionItemDataModel } from '@system/data/item';

// Terms
import { CosmereDiceGroup } from '../terms/cosmere-dice-group';
import { CosmereDie } from '../terms/cosmere-die';

// Dialogs
import { RollConfigurationDialog } from '@system/applications/dialogs/roll-configuration';

// Utils
import { renderSystemTemplate, TEMPLATES } from '@system/utils/templates';
import { TargetDescriptor } from '@system/utils/generic';

// Constants
import { SYSTEM_ID } from '@system/constants';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CosmereRollData = {
    source?: CosmereItem | CosmereActor | RollConfigurationDialog;

    parent?: string;

    parts?: string[];

    attributes: Record<Attribute, { value: number; bonus: number }>;

    skills: Record<
        Skill,
        {
            rank: number;
            mod: { value: number; derived: number; bonus: number };
            attribute: string;
        }
    >;

    deflect: number;

    scalar: { damage: Record<string, unknown>; power: Record<string, unknown> };

    targets?: TargetDescriptor[];

    description?: Promise<string>;
};

export interface CosmereRollOptions extends Partial<foundry.dice.Roll.Options> {
    title?: string;

    rollMode?: RollMode;

    speaker?: ChatMessage.SpeakerData;

    actor?: CosmereActor;

    /**
     * Should a chat message be created for this roll?
     * @default true
     */
    chatMessage?: boolean;

    /**
     * Should the roll be hidden in the chat message?
     * @default false
     */
    hidden?: boolean;

    /**
     * Should the roll be configured by a dialog?
     * For example, injury rolls do not need configuration
     * @default true
     */
    configure?: boolean;

    /**
     * If the roll comes from an item, whether or not the item usage should consume.
     * Only used if the item has consumption configured.
     * @default true
     */
    consume?: boolean;

    /**
     * Any consumption results will be included here.
     * Only used if the item use has consumption configured.
     */
    consumeResponse?: ActionItemDataModel.ConsumeData[];
}

export class CosmereRoll extends foundry.dice.Roll<CosmereRollData> {
    public constructor(
        formula: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(formula, data, options);

        this.parent = data?.parent;
        this.uuid = `cosmere:roll:${this.type}:${foundry.utils.randomID()}`;
        this._hidden = options.hidden ?? false;
        this._prepared = false;
    }

    static CHAT_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_GENERIC}`;

    static TOOLTIP_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_TOOLTIP}`;

    public uuid: string;
    public parent?: string;

    /* --- Accessors --- */
    protected _prepared: boolean;
    protected _hidden: boolean;

    protected get icon(): string {
        return 'fa-solid fa-dice';
    }

    protected get title(): string {
        return game.i18n.localize('GENERIC.OtherRoll');
    }

    public get type(): RollType {
        return RollType.Generic;
    }

    public override get dice(): CosmereDie[] {
        return this.groups.flatMap((g) => g.dice);
    }

    public get groups(): CosmereDiceGroup[] {
        return this.terms.filter((d) => d instanceof CosmereDiceGroup);
    }

    public get hidden(): boolean {
        return this._hidden;
    }

    public set hidden(hidden: boolean) {
        this._hidden = hidden;
    }

    public get constant() {
        let previous: unknown;
        let constant = 0;

        for (const term of this.terms) {
            if (term instanceof foundry.dice.terms.NumericTerm) {
                if (
                    previous instanceof foundry.dice.terms.OperatorTerm &&
                    previous.operator === '-'
                ) {
                    constant -= term.number;
                } else {
                    constant += term.number;
                }
            } else if (term instanceof foundry.dice.terms.FunctionTerm) {
                if (typeof term.total === 'number') {
                    constant += term.total;
                }
            }

            previous = term;
        }

        return constant;
    }

    public get hasAdvantage(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasAdvantage,
        );
    }

    public get hasDisadvantage(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasDisadvantage,
        );
    }

    public get hasOpportunity(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasOpportunity,
        );
    }

    public get hasComplication(): boolean {
        return this.terms.some(
            (t) => t instanceof CosmereDiceGroup && t.hasComplication,
        );
    }

    public get opportunityCount(): number {
        return this.terms
            .filter((t) => t instanceof CosmereDiceGroup && t.hasOpportunity)
            .reduce(
                (total, t) =>
                    total + ((t as CosmereDiceGroup).opportunityCount ?? 0),
                0,
            );
    }

    public get complicationCount(): number {
        return this.terms
            .filter((t) => t instanceof CosmereDiceGroup && t.hasComplication)
            .reduce(
                (total, t) =>
                    total + ((t as CosmereDiceGroup).complicationCount ?? 0),
                0,
            );
    }

    /* --- Functions --- */
    public static override instantiateAST(
        ast: foundry.dice.types.RollParseNode,
    ): foundry.dice.terms.RollTerm[] {
        return CONFIG.Dice.parser.flattenTree(ast).map((node) => {
            const cls =
                CONFIG.Dice.termTypes[node.class] ??
                foundry.dice.terms.RollTerm;
            return cls.fromParseNode(node);
        });
    }

    public static override fromData<T extends Roll.Internal.AnyConstructor>(
        this: T,
        data: Roll.Data & {
            uuid: string;
            prepared: boolean;
            hidden: boolean;
            parent: string;
        },
    ): FixedInstanceType<T> {
        const roll = super.fromData(data) as unknown as CosmereRoll;

        roll.uuid = data.uuid;
        roll.parent = data.parent;
        roll._prepared = data.prepared;
        roll._hidden = data.hidden;

        return roll as FixedInstanceType<T>;
    }

    public override toJSON() {
        return {
            class: this.constructor.name,
            uuid: this.uuid,
            options: this.options,
            terms: this.terms,
            dice: this.dice,
            formula: this._formula,
            total: this._total,
            evaluated: this._evaluated,
            prepared: this._prepared,
            hidden: this._hidden,
            parent: this.parent,
        };
    }

    public async prepare(options?: RollEvaluationOptions): Promise<this> {
        if (!this._prepared) {
            const preps: Promise<CosmereDiceGroup>[] = [];

            this.terms
                .filter((t) => t instanceof CosmereDiceGroup)
                .forEach((t) => preps.push(t.prepare(options)));

            await Promise.all(preps);

            this._prepared = true;
        }

        return this;
    }

    public override async evaluate(
        options?: RollEvaluationOptions,
    ): Promise<Roll.Evaluated<this>> {
        if (options?.maximize || options?.minimize || options?.reroll) {
            this._prepared = false;
            this._evaluated = false;
        }

        await this.prepare();

        return super.evaluate(options);
    }

    public async modify(
        modifier: DieModifier,
        uuid?: string,
        toggle?: boolean,
    ): Promise<this> {
        if (!this._prepared) {
            throw new Error(
                `The ${this.constructor.name} has not yet been prepared and cannot be modified`,
            );
        }

        const die = uuid
            ? this.dice.find((d) => d.uuid === uuid)
            : this.dice.find((d) => d !== undefined); // Apply modify to first die if no uuid given

        if (die) {
            if (toggle && die.hasModifier(modifier)) {
                await die.unmodify(modifier);
            } else {
                await die.modify(modifier);
            }
        }

        if (this._evaluated) this._total = this._evaluateTotal();

        return this;
    }

    public setDieResult(result: number, uuid: string): this {
        if (!this._evaluated) {
            throw new Error(
                `The ${this.constructor.name} has not yet been evaluated and cannot override results`,
            );
        }

        const die = this.dice.find((d) => d.uuid === uuid);

        if (die) {
            die.setResult(result);
        }

        if (this._evaluated) this._total = this._evaluateTotal();

        return this;
    }

    public override async render(
        options?:
            | InexactPartial<{
                  flavor: string;
                  template: string;
                  isPrivate: boolean;
                  message: CosmereChatMessage;
              }>
            | undefined,
    ): Promise<string> {
        if (this.parent !== undefined) {
            return '';
        }

        if (options?.isPrivate) {
            return renderSystemTemplate(TEMPLATES.CHAT_ROLL_PRIVATE, {});
        }

        const children = options?.message?.rolls.filter(
            (r) =>
                r instanceof CosmereRoll && r.parent === this.uuid && !r.hidden,
        );

        return renderSystemTemplate(TEMPLATES.CHAT_CARD_SECTION, {
            ...this._prepareChatSectionRenderContext(options),
            content: await super.render({
                ...options,
                ...{ children },
            }),
        });
    }

    public override async getTooltip(): Promise<string> {
        return foundry.applications.handlebars.renderTemplate(
            CosmereRoll.TOOLTIP_TEMPLATE,
            this._prepareTooltipRenderContext(),
        );
    }

    public async getTooltipConstant(): Promise<string> {
        if (this.constant === 0) return '';

        return renderSystemTemplate(TEMPLATES.CHAT_ROLL_TOOLTIP_CONSTANT, {
            sign: this.constant < 0 ? '-' : '+',
            total: Math.abs(this.constant),
        });
    }

    protected _prepareTooltipRenderContext() {
        const total = this.dice.reduce((sum, die) => sum + (die.total ?? 0), 0);

        const results = this.dice.flatMap((d) =>
            d.results.map((r) => {
                return {
                    result: d.getResultLabel(r),
                    classes: d.getResultCSS(r).filterJoin(' '),
                    uuid: d.uuid,
                };
            }),
        );

        return { total, results, uuid: this.uuid };
    }

    protected _prepareChatSectionRenderContext(
        options?:
            | InexactPartial<{
                  flavor: string;
                  isPrivate: boolean;
                  children: CosmereRoll[];
              }>
            | undefined,
    ) {
        return {
            uuid: this.uuid,
            type: this.type,
            icon: this.icon,
            title: this.title,
        };
    }

    protected async _prepareChatRenderContext(
        options?:
            | InexactPartial<{
                  flavor: string;
                  isPrivate: boolean;
                  children: CosmereRoll[];
              }>
            | undefined,
    ) {
        const children = options?.children ?? [];

        const tooltips: string[] = [];
        tooltips.push(await this.getTooltip());

        for (const child of children) {
            tooltips.push(await child.getTooltip());
        }

        tooltips.push(await this.getTooltipConstant());

        return {
            formula:
                this.formula +
                (children.length > 0
                    ? ` + ${children.map((r) => r.formula).join(' + ')}`
                    : ''),
            total:
                (this.total ?? 0) +
                children.reduce((sum, child) => sum + (child.total ?? 0), 0),
            tooltip: tooltips.join(''),
        };
    }
}
