import { ItemType } from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import { getItemSheet } from '../helpers/item';

test('Create talent with embedded action', async ({
    authenticatedPage: page,
    createItem,
}) => {
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
    const testTalent = await createItem('Test Talent', ItemType.Talent);
    const testTalentSheet = await getItemSheet(page, testTalent);
    await expect(testTalentSheet.locator('.item-header')).toBeVisible();
    await expect(testTalentSheet.locator('app-item-header'))
        .toMatchAriaSnapshot(`
      - img
      - textbox: Test Talent
      `);

    // await expect(page.getByRole('listitem').filter({ hasText: 'New Action — —' })).toBeVisible();
    // await expect(page.locator('#ActionItemSheet-Item-8w0YaDPHZvXhNMD7-Item-lfB0vzRMZQx1HQ6F > .window-content > .sheet-content > app-item-header > .sheet-header > .item-header')).toBeVisible();
    // await page.locator('select[name="system.activation.type"]').selectOption('utility');
    // await page.locator('select[name="system.activation.cost.type"]').selectOption('act');
    // await page.getByRole('spinbutton').fill('2');
    // await expect(page.locator('app-item-actions-list')).toContainText('2');
});
