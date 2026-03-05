// E2E tests for Actor creation and sheet interaction.

import { test, expect } from './fixtures/foundry-fixture';

test.describe('Actor Management', () => {
    test('should create a character actor', async ({
        foundryPage,
        sidebar,
    }) => {
        // Create a character through the sidebar
        await sidebar.createActor('E2E Test Character', 'character');

        // Verify the character sheet opens
        const sheet = foundryPage.locator('.application.sheet.actor');
        await expect(sheet).toBeVisible({ timeout: 10000 });

        // Clean up: delete the actor through the Foundry API
        await foundryPage.evaluate(async () => {
            const actor = game.actors?.getName('E2E Test Character');
            if (actor) await actor.delete();
        });
    });

    test('should create an adversary actor', async ({
        foundryPage,
        sidebar,
    }) => {
        await sidebar.createActor('E2E Test Adversary', 'adversary');

        const sheet = foundryPage.locator('.application.sheet.actor');
        await expect(sheet).toBeVisible({ timeout: 10000 });

        await foundryPage.evaluate(async () => {
            const actor = game.actors?.getName('E2E Test Adversary');
            if (actor) await actor.delete();
        });
    });
});
