import { CosmereActor, CosmereItem, InjuryItem } from '../documents';
import { InjuryType, RestType } from './cosmere';
import { AnyObject, CosmereDocument } from './utils';

export namespace CosmereHooks {
    /**
     * Apply Damage Hooks
     *
     * - preApplyDamage
     * - postApplyDamage
     */

    export type ApplyDamage = (
        actor: CosmereActor,
        damage: DamageValues,
    ) => boolean;

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
     * Migration Hooks
     *
     * `post` hooks only fire on a success, so modules can assume that
     * all data is correct for the corresponding version(s).
     *
     * Migration as a whole
     * - preMigration
     * - postMigration
     *
     * Each individual migration running
     * - preMigrationVersion
     * - postMigrationVersion
     */

    export type Migration = (from: string, to: string) => boolean;

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
     * The listed hooks are generic, but actual calls are specific to the type
     * e.g. preDamageRoll, postItemRollConfiguration, etc.
     *
     * - preRoll
     * - postRoll
     *
     * - preRollConfiguration
     * - postRollConfiguration
     */

    export type PreRoll = (
        roll: Roll,
        source: CosmereDocument,
        options?: unknown,
    ) => boolean;

    export type PostRoll =
        // Normal rolls
        | ((roll: Roll, source: CosmereDocument, options?: unknown) => boolean)
        // Rolls which additionally draw from a table
        | ((
              roll: Roll,
              tableResult: TableResult,
              source: CosmereDocument,
              options?: unknown,
          ) => boolean);

    export type RollConfig = (
        config: unknown,
        source: CosmereDocument,
    ) => boolean;

    /**
     * Miscellaneous types
     */

    export interface DamageValues {
        calculated: number; // Total damage calculation
        dealt?: number; // Actual damage dealt to actor
    }
}
