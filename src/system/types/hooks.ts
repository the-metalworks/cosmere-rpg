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
     * - postRollConfiguration
     */

    export type PreRoll = () => boolean; // TODO
    export type PostRoll = () => boolean; // TODO
    export type PostRollConfig = () => boolean; // TODO
}
