// Shared helpers for navigating FoundryVTT's auth and session screens.
// Used by auth.setup.ts (first-launch flow) and by the foundryPage fixture
// (re-join on each test).

import { Page, expect } from '@playwright/test';

/**
 * Dismiss any visible FoundryVTT UI tours.
 * Tours appear as `<aside>` overlays with an exit button; they can pop up
 * on any screen (Setup, Join, Game Canvas) after updates or first visits.
 */
export async function dismissTours(page: Page): Promise<void> {
    const tourExit = page.locator('aside .step-button[data-action="exit"]');
    while (await tourExit.isVisible({ timeout: 500 }).catch(() => false)) {
        await tourExit.click();
        await page.waitForTimeout(500);
    }
}

/**
 * From whatever screen FoundryVTT is currently showing, navigate to the
 * game canvas (#board).  Handles:
 *   - Already on game canvas → no-op
 *   - Join screen → select Gamemaster, click Join
 *   - Setup screen → launch test-world, then join
 *   - Tours on any screen
 *
 * Assumes the admin session cookie is already present (via storageState).
 */
export async function joinWorldIfNeeded(page: Page): Promise<void> {
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
        await dismissTours(page);

        // Already on the game canvas — done
        const board = page.locator('#board');
        if (await board.isVisible({ timeout: 2000 }).catch(() => false)) {
            return;
        }

        // Join screen: select Gamemaster and join
        const joinForm = page.locator('#join-game-form');
        if (await joinForm.isVisible({ timeout: 1000 }).catch(() => false)) {
            const userSelect = page.locator('select[name="userid"]');
            if (
                await userSelect.isVisible({ timeout: 500 }).catch(() => false)
            ) {
                await userSelect.selectOption({ label: 'Gamemaster' });
            }
            const joinButton = page.locator('button[name="join"]');
            await joinButton.click();
            // Joining triggers a full page load + WebSocket game init.
            // Wait for the game canvas to appear with a generous timeout
            // rather than relying on networkidle (which fires too early).
            await page
                .locator('#board')
                .waitFor({ state: 'visible', timeout: 30_000 });
            return;
        }

        // Setup screen: launch the test world
        if (page.url().includes('/setup')) {
            const launchButton = page.locator('a[data-action="worldLaunch"]');
            if (
                await launchButton
                    .isVisible({ timeout: 2000 })
                    .catch(() => false)
            ) {
                await launchButton.hover({
                    timeout: 500,
                    force: true,
                    position: { x: 2, y: 2 },
                });
                await launchButton.click();
                await page.waitForLoadState('networkidle');
                continue;
            }
        }

        // Nothing matched — wait and retry
        await page.waitForTimeout(1000);
    }

    // Final assertion — if we never reached the board, fail clearly
    await expect(page.locator('#board')).toBeVisible({ timeout: 30_000 });
}
