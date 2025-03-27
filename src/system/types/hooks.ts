import { CosmereActor, InjuryItem } from '../documents';
import { InjuryType, RestType } from './cosmere';

export namespace CosmereHooks {
    /**
     * Apply Damage Hooks
     *
     * - preApplyDamage
     * - postApplyDamage
     */

    export type ApplyDamage = (actor: CosmereActor, amount: number) => boolean;

    /**
     * Apply Injury Hooks
     *
     * - preApplyInjury
     * - postApplyInjury
     */

    export type PreApplyInjury = (
        message: ChatMessage,
        actor: CosmereActor | null,
        data: {
            type: InjuryType;
            duration: number;
        },
    ) => boolean;

    export type PostApplyInjury = (
        message: ChatMessage,
        actor: CosmereActor | null,
        injury: InjuryItem,
    ) => boolean;

    /**
     * Chat Message Interaction Hooks
     *
     * - chatMessageInteracted
     */

    export type MessageInteracted = (
        message: ChatMessage,
        event: JQuery.Event,
    ) => boolean;

    /**
     * Rest Hooks
     *
     * - preRest
     * - postRest
     */

    export type Rest = (actor: CosmereActor, duration: RestType) => boolean;

    /**
     * Roll Hooks
     *
     * - preRoll
     * - postRoll
     *
     * - pre/postRollConfiguration
     */

    export type PreRoll = (roll: Roll) => boolean;
    export type PostRoll =
        | ((roll: Roll) => boolean)
        | ((roll: Roll, result: TableResult) => boolean);
    export type RollConfig<T> = (config: T) => boolean;
}
