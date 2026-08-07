import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import { html5DragAndDrop } from '../helpers/drag-drop';

test('Add all basic actions, use them all', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;
    await page.getByRole('tab', { name: 'Compendium Packs' }).click();
    await page
        .locator('span')
        .filter({ hasText: 'Stormlight Starter Rules' })
        .click();
    await page.locator('a').filter({ hasText: 'Actions' }).click();
    await html5DragAndDrop(
        page,
        page.getByText('Basic Actions Pack'),
        testCharacterSheet,
    );

    await testCharacterSheet.locator('a').filter({ hasText: '3' }).click();

    // Expect all basic actions to appear on character sheet
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Aid r 1 Focus —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Avoid Danger r — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Banter 0 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Brace 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Disengage 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Dodge r 1 Focus —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Drop 0 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Gain Advantage 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Grapple 2 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Interact 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Move 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Reactive Strike r 1 Focus —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Ready 1 — —'),
    ).toBeVisible();
    // await expect(testCharacterSheet.locator('app-actor-actions-list').getByText('Recover 2 — —')).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Shove 2 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Strike 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Unarmed Attack 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('app-actor-actions-list')
            .getByText('Use A Skill 1 — —'),
    ).toBeVisible();

    // Update focus to max and test using the "Aid" action
    // await testCharacter.updateResource('Focus', 2);
    // await testCharacter.checkResource('Focus', 2, 2);
    // await testCharacterSheet.locator('app-actor-actions-list-entry:nth-child(1) > .item > .details > .img > .roll-icon').click();
    // await expect(page.getByRole('heading', { name: 'Consume Resource' })).toBeVisible();
    // await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    // await page.getByRole('button', { name: 'Continue' }).click();
    // await testCharacter.checkResource('Focus', 1, 2);
});
