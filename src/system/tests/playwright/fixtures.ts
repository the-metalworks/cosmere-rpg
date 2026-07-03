import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Declare the types for your custom fixtures
interface MyFixtures {
    authenticatedPage: Page;
}

export const test = base.extend<MyFixtures>({
    authenticatedPage: async ({ page }, use) => {
        // Setup: log in
        await page.goto('/game');

        // Provide the fixture to the test
        await use(page);

        // Wait for the game world to fully load
        console.log('Waiting for game world to load...');
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready === true,
            { timeout: 120_000 },
        );

        // Teardown (optional): clean up after the test
    },
});

export { expect };
