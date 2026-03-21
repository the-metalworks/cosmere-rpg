// Authenticates with FoundryVTT and saves the browser state for reuse by all tests.
//
// FoundryVTT first-launch flow has multiple screens that may appear:
//   - EULA acceptance
//   - Usage data sharing prompt
//   - Setup screen (admin key entry, world selection/launch)
//   - Join screen (user selection)
//   - Game canvas (authenticated)
//
// This setup handles all of them in a loop, navigating through whatever
// screens appear until the game canvas is reached.

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dismissTours } from './helpers/foundry-auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../../../playwright/.auth/user.json');

setup('authenticate with FoundryVTT', async ({ page }) => {
    setup.setTimeout(120_000);
    const adminKey = process.env.FOUNDRY_ADMIN_KEY ?? 'atropos';

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Loop through screens until we reach the game canvas.
    var attempts = 2;
    var didSomething = false;
    do {
        didSomething = false;
        await dismissTours(page);

        // Check if we've reached the game canvas
        const board = page.locator('#board');
        if (await board.isVisible({ timeout: 2000 }).catch(() => false)) {
            break;
        }

        // EULA acceptance
        const eulaForm = page.locator('#eula-form');
        if (await eulaForm.isVisible({ timeout: 1000 }).catch(() => false)) {
            await setup.step('Dismissing EULA', async () => {
                await page.locator('#eula-agree').check();
                await page.locator('#sign').click();
                await page.waitForLoadState('networkidle');
            });
            didSomething = true;
            continue;
        }

        // Setup screen: admin key entry (check before telemetry — both are on /setup)
        const adminKeyInput = page.locator('#key');
        if (
            await adminKeyInput.isVisible({ timeout: 1000 }).catch(() => false)
        ) {
            await setup.step('Logging in as Administrator', async () => {
                await adminKeyInput.fill(adminKey);
                await adminKeyInput.press('Enter');
                await page.waitForLoadState('networkidle');
            });
            didSomething = true;
            continue;
        }

        // Usage data sharing prompt
        const declineUsageData = page.locator('button[data-action="no"]');
        if (
            await declineUsageData
                .isVisible({ timeout: 1000 })
                .catch(() => false)
        ) {
            await setup.step('Declining Data Sharing', async () => {
                await declineUsageData.click();
                await page.waitForLoadState('networkidle');
            });
            didSomething = true;
            continue;
        }

        // Nothing matched — wait a moment and try again
        await page.waitForTimeout(500);
    } while (didSomething || attempts-- > 0);

    await dismissTours(page);

    // Setup screen: world launch
    if (page.url().includes('/setup')) {
        // Find the launch button for test-world (must hover over the <a> tag before clicking)
        const launchButton = page.locator(
            // 'li[data-package-id="test-world"] a[data-action="worldLaunch"]'
            'a[data-action="worldLaunch"]',
        );
        await setup.step('Hovering Launch Game World', async () => {
            await launchButton.hover({
                timeout: 500,
                force: true,
                position: { x: 2, y: 2 },
            });
        });
        await setup.step('Launching Game World', async () => {
            // Foundry reveals the launch control on hover
            await launchButton.click();
            await page.waitForLoadState('networkidle');
        });
    }

    // Join screen
    const joinForm = page.locator('#join-game-form');
    await setup.step('Joining Game World', async () => {
        await joinForm.isVisible({ timeout: 2000 }).catch(() => false);
        const userSelect = page.locator('select[name="userid"]');
        await setup.step('... as Gamemaster', async () => {
            await userSelect.isVisible({ timeout: 500 }).catch(() => false);
            await userSelect.selectOption({ label: 'Gamemaster' });
        });
        const joinButton = page.locator('button[name="join"]');
        await joinButton.click();
        await page.waitForLoadState('networkidle');
    });

    // <button type="button" class="header-control icon fa-solid fa-xmark" data-tooltip="Close Window" aria-label="Close Window" data-action="close"></button>

    await setup.step('Awaiting Game Board', async () => {
        // Verify we reached the game canvas
        await expect(page.locator('#board')).toBeVisible({
            timeout: 30000,
        });
    });

    // Save authentication state
    await page.context().storageState({ path: authFile });
});
