import { CosmereDocument } from '@system/types/utils';

import { SYSTEM_ID } from '@system/constants';

export type PreRoll = (
    roll: Roll,
    source: CosmereDocument,
    options?: unknown,
) => boolean;
export const PreRoll = (context: string) =>
    `${SYSTEM_ID}.pre${context}Roll` as const;
export type PreSkillRoll = PreRoll;
export const PreSkillRoll = `${SYSTEM_ID}.preSkillRoll` as const;
export type PreItemRoll = PreRoll;
export const PreItemRoll = `${SYSTEM_ID}.preItemRoll` as const;
export type PreAttackRoll = PreRoll;
export const PreAttackRoll = `${SYSTEM_ID}.preAttackRoll` as const;
export type PreDamageRoll = PreRoll;
export const PreDamageRoll = `${SYSTEM_ID}.preDamageRoll` as const;
export type PreInjuryTypeRoll = PreRoll;
export const PreInjuryTypeRoll = `${SYSTEM_ID}.preInjuryTypeRoll` as const;
export type PreInjuryDurationRoll = PreRoll;
export const PreInjuryDurationRoll =
    `${SYSTEM_ID}.preInjuryDurationRoll` as const;
export type PreShortRestRecoveryRoll = PreRoll;
export const PreShortRestRecoveryRoll =
    `${SYSTEM_ID}.preShortRestRecoveryRoll` as const;

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
export const PostRoll = (context: string) =>
    `${SYSTEM_ID}.post${context}Roll` as const;
export type PostSkillRoll = PostRoll;
export const PostSkillRoll = `${SYSTEM_ID}.postSkillRoll` as const;
export type PostItemRoll = PostRoll;
export const PostItemRoll = `${SYSTEM_ID}.postItemRoll` as const;
export type PostAttackRoll = PostRoll;
export const PostAttackRoll = `${SYSTEM_ID}.postAttackRoll` as const;
export type PostDamageRoll = PostRoll;
export const PostDamageRoll = `${SYSTEM_ID}.postDamageRoll` as const;
export type PostInjuryTypeRoll = PostRoll;
export const PostInjuryTypeRoll = `${SYSTEM_ID}.postInjuryTypeRoll` as const;
export type PostInjuryDurationRoll = PostRoll;
export const PostInjuryDurationRoll =
    `${SYSTEM_ID}.postInjuryDurationRoll` as const;
export type PostShortRestRecoveryRoll = PostRoll;
export const PostShortRestRecoveryRoll =
    `${SYSTEM_ID}.postShortRestRecoveryRoll` as const;

export type RollConfig = (config: unknown, source: CosmereDocument) => boolean;
export type PreRollConfiguration = RollConfig;
export const PreRollConfiguration = (context: string) =>
    `${SYSTEM_ID}.pre${context}RollConfiguration` as const;
export type PostRollConfiguration = RollConfig;
export const PostRollConfiguration = (context: string) =>
    `${SYSTEM_ID}.post${context}RollConfiguration` as const;
export type PreSkillRollConfiguration = PreRollConfiguration;
export const PreSkillRollConfiguration =
    `${SYSTEM_ID}.preSkillRollConfiguration` as const;
export type PostSkillRollConfiguration = PostRollConfiguration;
export const PostSkillRollConfiguration =
    `${SYSTEM_ID}.postSkillRollConfiguration` as const;
export type PreItemRollConfiguration = PreRollConfiguration;
export const PreItemRollConfiguration =
    `${SYSTEM_ID}.preItemRollConfiguration` as const;
export type PostItemRollConfiguration = PostRollConfiguration;
export const PostItemRollConfiguration =
    `${SYSTEM_ID}.postItemRollConfiguration` as const;
export type PreAttackRollConfiguration = PreRollConfiguration;
export const PreAttackRollConfiguration =
    `${SYSTEM_ID}.preAttackRollConfiguration` as const;
export type PostAttackRollConfiguration = PostRollConfiguration;
export const PostAttackRollConfiguration =
    `${SYSTEM_ID}.postAttackRollConfiguration` as const;
