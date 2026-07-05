import { test, expect } from './fixtures';

test('Foundry accessible', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
});

test('System loaded', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: 'Game Settings' }).click();
    await expect(
        page.locator('#settings').getByText('Cosmere Roleplaying Game'),
    ).toBeVisible();
});

test('Stormlight Starter Rules Present', async ({
    authenticatedPage: page,
}) => {
    await page.getByRole('tab', { name: 'Compendium Packs' }).click();
    await expect(
        page.locator('a').filter({ hasText: 'Stormlight Starter Rules' }),
    ).toBeVisible();
    await page
        .locator('a')
        .filter({ hasText: 'Stormlight Starter Rules' })
        .click();
    await expect(
        page
            .locator('#compendium-cosmere-rpg_starter-rules')
            .getByRole('strong'),
    ).toBeVisible();
    await expect(
        page.locator('#compendium-cosmere-rpg_starter-rules'),
    ).toContainText('Stormlight Starter Rules');
});
