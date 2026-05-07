/* eslint-disable @typescript-eslint/class-literal-property-style */

import { InjuryType } from '@src/system/types/cosmere';
import { RollEvaluationOptions, RollType } from '../types';
import {
    CosmereRoll,
    CosmereRollData,
    CosmereRollOptions,
} from './cosmere-roll';
import {
    FixedInstanceType,
    InexactPartial,
} from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { renderSystemTemplate, TEMPLATES } from '@src/system/utils/templates';

export type CosmereInjuryRollData = CosmereRollData & {
    deflect: number;

    mod: number;

    type: InjuryType;

    duration: number;

    details: string;

    img: string;

    character: string;
};

export class CosmereInjuryRoll extends CosmereRoll {
    public constructor(
        formula: string,
        data: CosmereRollData,
        options: CosmereRollOptions = {},
    ) {
        super(formula, data, options);
    }

    /* --- Accessors --- */
    protected override get icon(): string {
        return 'fa-solid fa-heart-crack';
    }

    protected override get title(): string {
        return game.i18n.localize('COSMERE.ChatMessage.InjuryRoll');
    }

    public override get type(): RollType {
        return RollType.Injury;
    }

    public override get hasAdvantage() {
        return false;
    }

    public override get hasDisadvantage() {
        return false;
    }

    public override get hasOpportunity() {
        return false;
    }

    public override get hasComplication() {
        return false;
    }

    /* --- Functions --- */
    public static override fromData<T extends Roll.Internal.AnyConstructor>(
        this: T,
        data: Roll.Data & {
            uuid: string;
            prepared: boolean;
            hidden: boolean;
            parent: string;
            type: InjuryType;
            duration: number;
            details: string;
            img: string;
            character: string;
        },
    ): FixedInstanceType<T> {
        const roll = super.fromData(data) as unknown as CosmereInjuryRoll;

        (roll.data as CosmereInjuryRollData).type = data.type;
        (roll.data as CosmereInjuryRollData).duration = data.duration;
        (roll.data as CosmereInjuryRollData).details = data.details;
        (roll.data as CosmereInjuryRollData).img = data.img;
        (roll.data as CosmereInjuryRollData).character = data.character;

        return roll as FixedInstanceType<T>;
    }

    public override toJSON() {
        return {
            ...super.toJSON(),
            type: (this.data as CosmereInjuryRollData).type,
            duration: (this.data as CosmereInjuryRollData).duration,
            details: (this.data as CosmereInjuryRollData).details,
            img: (this.data as CosmereInjuryRollData).img,
            character: (this.data as CosmereInjuryRollData).character,
        };
    }

    public override async evaluate(
        options?: RollEvaluationOptions,
    ): Promise<Roll.Evaluated<this>> {
        const evaluation = await super.evaluate(options);

        const table = (await fromUuid(
            CONFIG.COSMERE.injury.durationTable,
        )) as unknown as RollTable;
        const result = table.getResultsForRoll(this.total!)[0];
        const injury = result.getFlag(SYSTEM_ID, 'injury-data');

        const data = foundry.utils.deepClone(this.data);
        data.parent = this.uuid;
        data.parts = [injury.durationFormula ?? '-1'];
        const duration = new CosmereRoll(data.parts.join(' + '), data, {});
        await duration.evaluate();

        let title;
        const actor = (this.data as CosmereInjuryRollData).character ?? 'Actor';
        switch (injury.type) {
            case InjuryType.Death:
                title = game.i18n.format(
                    'COSMERE.ChatMessage.InjuryDuration.Dead',
                    { actor },
                );
                break;
            case InjuryType.PermanentInjury:
                title = game.i18n.format(
                    'COSMERE.ChatMessage.InjuryDuration.Permanent',
                    { actor },
                );
                break;
            default: {
                title = game.i18n.format(
                    'COSMERE.ChatMessage.InjuryDuration.Temporary',
                    { actor, days: (duration?.total ?? 0).toFixed() },
                );
                break;
            }
        }

        (this.data as CosmereInjuryRollData).type = injury.type;
        (this.data as CosmereInjuryRollData).duration = duration.total!;
        (this.data as CosmereInjuryRollData).details = result.description;
        (this.data as CosmereInjuryRollData).img = result.img!;

        this.data.description = renderSystemTemplate(
            TEMPLATES.CHAT_CARD_DESCRIPTION,
            {
                title,
                img: result.img,
                description: result.description,
                injury: true,
                apply: true,
                uuid: this.uuid,
            },
        );

        return evaluation;
    }

    protected override _prepareChatSectionRenderContext(
        options?:
            | InexactPartial<{
                  flavor: string;
                  isPrivate: boolean;
                  children: CosmereRoll[];
              }>
            | undefined,
    ) {
        return {
            ...super._prepareChatSectionRenderContext(options),
            subtitle: {
                skill: CONFIG.COSMERE.injury.types[
                    (this.data as CosmereInjuryRollData).type
                ].label,
            },
        };
    }
}
