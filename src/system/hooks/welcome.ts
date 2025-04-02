// Dialogs
import { ReleaseNotesDialog } from '@system/applications/dialogs/release-notes';

// Constants
import {
    SYSTEM_ID,
    METALWORKS_DISCORD_INVITE,
    GITHUB_ISSUES_URL,
    GITHUB_CONTRIBUTING_URL,
    AUTHOR_NAME,
} from '@system/constants';

// Settings
import { getSystemSetting, setSystemSetting, SETTINGS } from '../settings';

// Migration
import { migrate, requiresMigration } from '../utils/migration';

Hooks.on('ready', async () => {
    // Ensure this message is only displayed when creating a new world
    if (!game.user!.isGM || !getSystemSetting(SETTINGS.INTERNAL_FIRST_CREATION))
        return;

    // Get system version
    const version = game.system!.version;

    // Display the welcome message
    await ChatMessage.create({
        content: game.i18n!.format('COSMERE.ChatMessage.Welcome', {
            version,
            discordLink: METALWORKS_DISCORD_INVITE,
            issuesLink: GITHUB_ISSUES_URL,
            contributingLink: GITHUB_CONTRIBUTING_URL,
        }),
        speaker: {
            alias: AUTHOR_NAME,
        },
        flags: {
            [SYSTEM_ID]: {
                headerImg: `systems/${SYSTEM_ID}/assets/art/the-metalworks.png`,
            },
        },
    });

    // Mark the setting so the message doesn't appear again
    await game.settings!.set(SYSTEM_ID, 'firstTimeWorldCreation', false);
});

Hooks.on('ready', async () => {
    // Ensure user is a GM
    if (!game.user!.isGM) return;

    // The current installed version of the system
    const currentVersion = game.system!.version;

    // The last used version of the system
    const latestVersion = getSystemSetting<string>(
        SETTINGS.INTERNAL_LATEST_VERSION,
    );

    const [currentMajor, currentMinor, currentPatch] = currentVersion
        .split('.')
        .map(Number);
    const [latestMajor, latestMinor, latestPatch] = latestVersion
        .split('.')
        .map(Number);

    // Convert the version strings to numbers
    const currentVersionNum =
        currentMajor * 1000000 + currentMinor * 1000 + currentPatch;
    const latestVersionNum =
        latestMajor * 1000000 + latestMinor * 1000 + latestPatch;

    if (currentVersionNum > latestVersionNum) {
        // Show the release notes
        void ReleaseNotesDialog.show({
            patch: !(currentMajor > latestMajor || currentMinor > latestMinor),
        });

        // Migrate data from the previous version of the system
        if (requiresMigration(latestVersion, currentVersion)) {
            await migrate(latestVersion, currentVersion);
        }

        // Record the latest version of the system
        await setSystemSetting(
            SETTINGS.INTERNAL_LATEST_VERSION,
            currentVersion,
        );
    }
});
