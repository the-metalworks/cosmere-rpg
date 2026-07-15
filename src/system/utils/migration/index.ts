// Types
import { SYSTEM_ID, SYSTEM_NAME } from '@system/constants';
import { Migration } from '@system/types/migration';
import { CosmereHooks } from '@system/types/hooks';
import { GlobalUI } from '@system/types/utils';

// Migrations
import MIGRATE_0_2__0_3 from './migrations/0.2-0.3';
import MIGRATE_0_3__1_0 from './migrations/0.3-1.0';
import MIGRATE_2_1__3_0 from './migrations/2.1-3.0';

// Utils
import { Logger } from '@system/utils/logger';

// Events
import { EventSystem } from '@system/hooks/item-event-system';

// Constants
import { HOOKS } from '@system/constants/hooks';

const MIGRATIONS: Migration[] = [
    MIGRATE_0_2__0_3,
    MIGRATE_0_3__1_0,
    MIGRATE_2_1__3_0,
];
const logger = new Logger('migration');

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
export async function migrate(from: string, to: string, packID?: string) {
    // Disable event system to prevent infinite loop errors when performing
    // substantial migrations
    EventSystem.disable();

    // Reduce versions to format 'major.minor'
    from = simplifyVersion(from);
    to = simplifyVersion(to);

    /**
     * Hook: preMigration
     */
    Hooks.callAll(HOOKS.PRE_MIGRATION, from, to);

    // Get all migrations between the versions
    const migrations = MIGRATIONS.filter((migration) => {
        return (
            versionToNumber(migration.from) >= versionToNumber(from) &&
            versionToNumber(migration.to) <= versionToNumber(to)
        );
    });

    if (migrations.length === 0) {
        logger.log(`Migration is not required for this version.`);
        return;
    }

    // Execute migrations in order
    for (const migration of migrations) {
        /**
         * Hook: preMigrationVersion
         */
        Hooks.callAll(HOOKS.PRE_MIGRATE_VERSION, migration.from, migration.to);

        const packName = packID ? ` (${packID})` : '';

        try {
            logger.log(
                `${migration.from} -> ${migration.to}: Running${packName}`,
            );

            await migration.execute(packID);

            logger.log(
                `${migration.from} -> ${migration.to}: Succeeded${packName}`,
            );
        } catch (err) {
            ui.notifications.error(
                game.i18n.format(
                    `COSMERE.Migration.${packID ? 'MigrationErrorPack' : 'MigrationError'}`,
                    {
                        from: migration.from,
                        to: migration.to,

                        ...(packID ? { pack: packID } : {}),
                    },
                ),
            );

            logger.error(`Error running data migration${packName}:`, err);
            logger.log(
                `${migration.from} -> ${migration.to}: Failed${packName}, exiting`,
            );
            return;
        }

        /**
         * Hooks: migrateVersion
         */
        Hooks.callAll(HOOKS.MIGRATE_VERSION, migration.from, migration.to);
    }

    // Re-render sidebar to include re-validated documents
    logger.log(`Successfully migrated data! Refreshing sidebar...`);
    await (globalThis as unknown as GlobalUI).ui.sidebar.render();

    /**
     * Hook: migration
     */
    Hooks.callAll(HOOKS.MIGRATION, from, to);

    // Re-enable event system
    EventSystem.enable();
}

/* --- Manual Invocation --- */
export async function invokeMigration(
    from: string,
    to: string,
    compendiumIDs: string[] = [],
) {
    if (!game.user.isGM) return;
    if (!requiresMigration(from, to)) return;

    // Migrate world data
    if (compendiumIDs.length === 0) {
        await migrate(from, to);
        return;
    }

    // Migrate compendiums synchronously
    for (const id of compendiumIDs) {
        // Ensure compendiums exist
        const compendium = game.packs?.get(id);
        if (!compendium) return;

        // Ensure compendiums are unlocked
        const wasLocked = compendium.locked;
        await compendium.configure({ locked: false });

        // Migrate data across full range
        await migrate(from, to, compendium.collection);

        // Restore compendium to original locked/unlocked state
        await compendium.configure({ locked: wasLocked });
    }
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
