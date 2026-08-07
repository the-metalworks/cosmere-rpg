import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import { html5DragAndDrop } from '../helpers/drag-drop';
import { clearNotifications } from '../helpers/notifications';

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

    await testCharacter.switchToActionsTab();

    // Expect all basic actions to appear on character sheet
    await testCharacter.checkHasAction('Aid', 'r', '1 Focus', '—');
    await testCharacter.checkHasAction('Avoid Danger', 'r', '—', '—');
    await testCharacter.checkHasAction('Banter', '0', '—', '—');
    await testCharacter.checkHasAction('Brace', '1', '—', '—');
    await testCharacter.checkHasAction('Disengage', '1', '—', '—');
    await testCharacter.checkHasAction('Dodge', 'r', '1 Focus', '—');
    await testCharacter.checkHasAction('Drop', '0', '—', '—');
    await testCharacter.checkHasAction('Gain Advantage', '1', '—', '—');
    await testCharacter.checkHasAction('Grapple', '2', '—', '—');
    await testCharacter.checkHasAction('Interact', '1', '—', '—');
    await testCharacter.checkHasAction('Move', '1', '—', '—');
    await testCharacter.checkHasAction('Reactive Strike', 'r', '1 Focus', '—');
    await testCharacter.checkHasAction('Ready', '1', '—', '—');
    // await testCharacter.checkHasAction("Recover", "2", "—", "—");
    await testCharacter.checkHasAction('Shove', '2', '—', '—');
    await testCharacter.checkHasAction('Strike', '1', '—', '—');
    await testCharacter.checkHasAction('Unarmed Attack', '1', '—', '—');
    await testCharacter.checkHasAction('Use A Skill', '1', '—', '—');
    await clearNotifications(page);

    // Update focus to max and test using the "Aid" action
    await testCharacter.updateResource('Focus', 2);
    await testCharacter.checkResource('Focus', 2, 2);
    const aidLocator = await testCharacter.actionLocator('Aid');
    await aidLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Consume Resource' }),
    ).toBeVisible();
    await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await testCharacter.checkResource('Focus', 1, 2);

    await page.pause();
});
