type _Migration<R> = (from: string, to: string) => R;
export type PreMigration = _Migration<boolean>;
export type Migration = _Migration<void>;
export type PreMigrateVersion = _Migration<boolean>;
export type MigrateVersion = _Migration<void>;
