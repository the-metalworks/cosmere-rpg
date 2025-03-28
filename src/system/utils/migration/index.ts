// Types
import { SYSTEM_ID, SYSTEM_NAME } from '@src/system/constants';
import { Migration } from '@src/system/types/migration';

// Migrations
import MIGRATE_0_2__0_3 from './migrations/0.2-0.3';
import { GlobalUI } from '@src/system/types/utils';
import { CosmereHooks } from '@src/system/types/hooks';

// Constants
const MIGRATIONS: Migration[] = [MIGRATE_0_2__0_3];

/**
 * Check if the world requires migration between the two version
 */
export function requiresMigration(from: string, to: string) {
    // Reduce versions to format 'major.minor'
    from = simplifyVersion(from);
    to = simplifyVersion(to);

    // Check all migrations beteen the versions
    return MIGRATIONS.some((migration) => {
        return (
            versionToNumber(migration.from) >= versionToNumber(from) &&
            versionToNumber(migration.to) <= versionToNumber(to)
        );
    });
}

/**
 * Execute any relevant migrations between the two versions
 */
export async function migrate(from: string, to: string) {
    // Reduce versions to format 'major.minor'
    from = simplifyVersion(from);
    to = simplifyVersion(to);

    /**
     * Hook: preMigration
     */
    Hooks.callAll<CosmereHooks.Migration>('cosmere.preMigration', from, to);

    // Get all migrations between the versions
    const migrations = MIGRATIONS.filter((migration) => {
        return (
            versionToNumber(migration.from) >= versionToNumber(from) &&
            versionToNumber(migration.to) <= versionToNumber(to)
        );
    });

    if (migrations.length === 0) {
        console.log(
            `[${SYSTEM_ID}] Migration is not required for this version.`,
        );
        return;
    }

    // Execute migrations in order
    for (const migration of migrations) {
        /**
         * Hook: preMigrationVersion
         */
        Hooks.callAll<CosmereHooks.Migration>(
            'cosmere.preMigrationVersion',
            migration.from,
            migration.to,
        );

        try {
            console.log(
                `[${SYSTEM_ID}] Migration ${migration.from} -> ${migration.to}: Running`,
            );
            await migration.execute();
            console.log(
                `[${SYSTEM_ID}] Migration ${migration.from} -> ${migration.to}: Succeeded`,
            );
        } catch (err) {
            console.error(`[${SYSTEM_ID}] Error running data migration:`, err);
            console.log(
                `[${SYSTEM_ID}] Migration ${migration.from} -> ${migration.to}: Failed, exiting`,
            );
            return;
        }

        /**
         * Hooks: postMigrationVersion
         */
        Hooks.callAll<CosmereHooks.Migration>(
            'cosmere.postMigrationVersion',
            migration.from,
            migration.to,
        );
    }

    // Re-render sidebar to include re-validated documents
    console.log(
        `[${SYSTEM_ID}] Successfully migrated data! Refreshing sidebar...`,
    );
    await (globalThis as unknown as GlobalUI).ui.sidebar.render();

    /**
     * Hook: postMigration
     */
    Hooks.callAll<CosmereHooks.Migration>('cosmere.postMigration', from, to);
}

/* --- Helpers --- */

function simplifyVersion(version: string) {
    return version.split('.').slice(0, 2).join('.');
}

function versionToNumber(version: string) {
    return version
        .split('.')
        .reverse()
        .map(Number)
        .reduce((acc, val, i) => acc + val * Math.pow(1000, i), 0);
}
