import { test, expect } from '../fixtures';

test('Create talent with embedded action', async ({
    authenticatedPage: page,
}) => {
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
    await page.getByRole('tab', { name: 'Items' }).click();
    await page.getByRole('button', { name: ' Create Item' }).click();
    await page.getByRole('combobox').selectOption('talent');
    await page.getByRole('textbox', { name: 'Talent' }).click();
    await page.getByRole('textbox', { name: 'Talent' }).fill('Test Talent');
    await page.getByRole('heading', { name: 'Create Item' }).click();
    await page.getByRole('button', { name: ' Create Item' }).click();
    await expect(page.locator('.item-header')).toBeVisible();
    await expect(page.locator('app-item-header')).toMatchAriaSnapshot(`
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
