import { test, expect } from './fixtures';
import { openCompendium } from './helpers/compendium';

test('Foundry accessible, System loaded, Stormlight Starter Rules Present', async ({
    authenticatedPage: page,
}) => {
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(
        page.locator('#settings').getByText('Cosmere Roleplaying Game'),
    ).toBeVisible();
    const starterRulesCompendium = await openCompendium(
        page,
        'Stormlight Starter Rules',
    );
    await expect(starterRulesCompendium.getByRole('strong')).toBeVisible();
    await expect(starterRulesCompendium).toContainText(
        'Stormlight Starter Rules',
    );
});
