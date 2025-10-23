import { HOOKS } from '@system/constants/hooks';

type _Migration<R> = (from: string, to: string) => R;
export type PreMigration = _Migration<boolean>;
export type Migration = _Migration<void>;
export type PreMigrateVersion = _Migration<boolean>;
export type MigrateVersion = _Migration<void>;

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    namespace Hooks {
        interface HookConfig {
            [HOOKS.PRE_MIGRATION]: PreMigration;
            [HOOKS.MIGRATION]: Migration;
            [HOOKS.PRE_MIGRATE_VERSION]: PreMigrateVersion;
            [HOOKS.MIGRATE_VERSION]: MigrateVersion;
        }
    }
}