import { test, expect } from './fixtures';

test('Foundry accessible', async ({ page }) => {
    await page.goto('/game');
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
});

test('System loaded', async ({ page }) => {
    await page.goto('/game');
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
});
