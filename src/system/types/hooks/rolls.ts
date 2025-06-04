import { CosmereDocument } from '@system/types/utils';

export type PreRoll = (
    roll: globalThis.Roll,
    source: CosmereDocument,
    options?: unknown,
) => boolean;
export type PreSkillRoll = PreRoll;
export type PreItemRoll = PreRoll;
export type PreAttackRoll = PreRoll;
export type PreDamageRoll = PreRoll;
export type PreInjuryTypeRoll = PreRoll;
export type PreInjuryDurationRoll = PreRoll;
export type PreShortRestRecoveryRoll = PreRoll;

export type Roll =
    // Normal rolls
    | ((
          roll: globalThis.Roll,
          source: CosmereDocument,
          options?: unknown,
      ) => void)
    // Rolls which additionally draw from a table
    | ((
          roll: globalThis.Roll,
          tableResult: TableResult,
          source: CosmereDocument,
          options?: unknown,
      ) => void);
export type SkillRoll = Roll;
export type ItemRoll = Roll;
export type AttackRoll = Roll;
export type DamageRoll = Roll;
export type InjuryTypeRoll = Roll;
export type InjuryDurationRoll = Roll;
export type ShortRestRecoveryRoll = Roll;

export type RollConfig<R> = (config: unknown, source: CosmereDocument) => R;
export type PreRollConfiguration = RollConfig<boolean>;
export type RollConfiguration = RollConfig<void>;
export type PreSkillRollConfiguration = PreRollConfiguration;
export type SkillRollConfiguration = RollConfiguration;
export type PreItemRollConfiguration = PreRollConfiguration;
export type ItemRollConfiguration = RollConfiguration;
export type PreAttackRollConfiguration = PreRollConfiguration;
export type AttackRollConfiguration = RollConfiguration;
