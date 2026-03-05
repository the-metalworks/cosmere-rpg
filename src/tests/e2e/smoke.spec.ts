// Basic smoke tests verifying the FoundryVTT instance is running
// and the cosmere-rpg system is loaded.

import { test, expect } from './fixtures/foundry-fixture';

test.describe('Smoke Tests', () => {
    test('should load the game canvas', async ({ foundryPage }) => {
        await expect(foundryPage.locator('#board')).toBeVisible({
            timeout: 30000,
        });
    });

    test('should have the cosmere-rpg system active', async ({
        foundryPage,
    }) => {
        const systemId = await foundryPage.evaluate(() => game.system.id);
        expect(systemId).toBe('cosmere-rpg');
    });

    test('should display the sidebar', async ({ sidebar }) => {
        await expect(sidebar.actorsTab).toBeVisible();
        await expect(sidebar.itemsTab).toBeVisible();
    });
});
