import {
    CosmereActor,
    CosmereActorRollData,
    CosmereItem,
    InjuryItem,
} from '../documents';
import { RestType } from './cosmere';

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
    export type ApplyInjury = (
        actor: CosmereActor,
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
     * Data Derivation Hooks
     *
     * - postActorDataDerivation
     * - postItemDataDerivation
     */
    export type DataDerivation<T extends CosmereActor | CosmereItem> = (
        document: T,
        data: CosmereActorRollData,
    ) => boolean;

    /**
     * Rest Hooks
     *
     * - preRest
     * - preShortRest
     * - preLongRest
     *
     * - postRest
     * - postShortRest
     * - postLongRest
     */
    export type Rest = (actor: CosmereActor, duration: RestType) => boolean;

    /**
     * Roll Hooks
     *
     * - preRoll
     *
     * - postRoll
     * - postRollConfiguration
     */
    export type PreRoll = () => boolean; // TODO
    export type PostRoll = () => boolean; // TODO
    export type PostRollConfig = () => boolean; // TODO
}
