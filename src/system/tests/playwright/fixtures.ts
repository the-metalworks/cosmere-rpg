import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Declare the types for your custom fixtures
interface MyFixtures {
    authenticatedPage: Page;
}

export const test = base.extend<MyFixtures>({
    authenticatedPage: async ({ page }, use) => {
        await page.goto('/game');
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready === true,
            { timeout: 120_000 },
        );

        const hardwareAccelerationWarning = page
            .locator('.notification.warning.permanent')
            .filter({
                hasText:
                    /Hardware Acceleration Disabled|does not have hardware acceleration enabled/i,
            });

        if (await hardwareAccelerationWarning.isVisible()) {
            await hardwareAccelerationWarning.click();
        }

        await use(page);
    },
});

export { expect };
