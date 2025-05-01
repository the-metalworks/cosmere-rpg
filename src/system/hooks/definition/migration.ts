import { SYSTEM_ID } from '@system/constants';

export type Migration = (from: string, to: string) => boolean;
export type PreMigration = Migration;
export const PreMigration = `${SYSTEM_ID}.preMigration` as const;
export type PostMigration = Migration;
export const PostMigration = `${SYSTEM_ID}.postMigration` as const;
export type PreMigrateVersion = Migration;
export const PreMigrateVersion = `${SYSTEM_ID}.preMigrateVersion` as const;
export type PostMigrateVersion = Migration;
export const PostMigrateVersion = `${SYSTEM_ID}.postMigrateVersion` as const;
