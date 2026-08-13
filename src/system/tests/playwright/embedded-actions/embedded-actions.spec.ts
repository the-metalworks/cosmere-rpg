import { ItemType } from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';

test('Create talent with embedded action', async ({
    authenticatedPage: page,
    createItem,
}) => {
    await expect(page).toHaveTitle('Foundry Virtual Tabletop');
    const testTalent = await createItem('Test Talent', ItemType.Talent);
    const testTalentSheet = testTalent.locator;
    await expect(testTalentSheet.locator('.item-header')).toBeVisible();
    await expect(testTalentSheet.locator('app-item-header'))
        .toMatchAriaSnapshot(`
      - img
      - textbox: Test Talent
      `);
    await testTalentSheet.getByText('Actions').click();
    const embeddedAction = await testTalent.createEmbeddedItem();
    const embeddedActionSheet = embeddedAction.locator;

    await expect(
        testTalentSheet.getByRole('listitem').filter({ hasText: 'New Action' }),
    ).toBeVisible();
    await embeddedActionSheet.getByText('Details').click();
    await expect(
        testTalentSheet
            .getByRole('listitem')
            .filter({ hasText: 'New Action — —' }),
    ).toBeVisible();
    await embeddedActionSheet
        .locator('select[name="system.activation.type"]')
        .selectOption('utility');
    await embeddedActionSheet
        .locator('select[name="system.activation.cost.type"]')
        .selectOption('act');
    await embeddedActionSheet.getByRole('spinbutton').click();
    await embeddedActionSheet.getByRole('spinbutton').fill('2');
    await embeddedActionSheet.getByText('Details').click();
    await expect(
        testTalentSheet.locator('app-item-actions-list'),
    ).toContainText('2');
    await embeddedActionSheet
        .locator('app-item-resource-consumption-list > .controls > a')
        .click();
    await expect(
        embeddedActionSheet.locator('app-item-resource-consumption-list'),
    ).toContainText('1 Focus from Ancestor of type Actor');
    await expect(
        testTalentSheet.locator('app-item-actions-list'),
    ).toContainText('New Action 2 1 Focus —');

    await page.locator('select[name="resource"]').selectOption('inv');
    await expect(
        embeddedActionSheet.locator('app-item-resource-consumption-list'),
    ).toContainText('1 Investiture from Ancestor of type Actor');
    await expect(
        testTalentSheet.locator('app-item-actions-list'),
    ).toContainText('New Action 2 1 Investiture —');

    await page.locator('input[name="value"]').fill('1+');
    await page.getByText('Latency').click();
    await expect(
        embeddedActionSheet.locator('app-item-resource-consumption-list'),
    ).toContainText('1+ Investiture from Ancestor of type Actor');
    await expect(
        testTalentSheet.locator('app-item-actions-list'),
    ).toContainText('New Action 2 1+ Investiture —');

    await page.locator('input[name="value"]').fill('0-2');
    await page.getByText('Latency').click();
    await expect(
        embeddedActionSheet.locator('app-item-resource-consumption-list'),
    ).toContainText('0-2 Investiture from Ancestor of type Actor');
    await expect(
        testTalentSheet.locator('app-item-actions-list'),
    ).toContainText('New Action 2 1 - 2 Investiture (Optional) —');
});
