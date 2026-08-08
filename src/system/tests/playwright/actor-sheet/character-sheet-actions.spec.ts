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
    await testCharacter.checkHasAction('Aid', 'r', '1 Focus');
    await testCharacter.checkHasAction('Avoid Danger', 'r');
    await testCharacter.checkHasAction('Banter', '0');
    await testCharacter.checkHasAction('Brace', '1');
    await testCharacter.checkHasAction('Disengage', '1');
    await testCharacter.checkHasAction('Dodge', 'r', '1 Focus');
    await testCharacter.checkHasAction('Drop', '0');
    await testCharacter.checkHasAction('Gain Advantage', '1');
    await testCharacter.checkHasAction('Grapple', '2');
    await testCharacter.checkHasAction('Interact', '1');
    await testCharacter.checkHasAction('Move', '1');
    await testCharacter.checkHasAction('Reactive Strike', 'r', '1 Focus');
    await testCharacter.checkHasAction('Ready', '1');
    await testCharacter.checkHasAction(
        'Recover',
        '2',
        '1 Use from 1 / 1',
        '1 / 1 Per scene',
    );
    await testCharacter.checkHasAction('Shove', '2');
    await testCharacter.checkHasAction('Strike', '1');
    await testCharacter.checkHasAction('Unarmed Attack', '1');
    await testCharacter.checkHasAction('Use A Skill', '1');
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
    //TODO: Check for chat popup

    const avoidDangerLocator =
        await testCharacter.actionLocator('Avoid Danger');
    await avoidDangerLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Avoid Danger (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();

    const banterLocator = await testCharacter.actionLocator('Banter');
    await banterLocator.locator('.img').click();

    const braceLocator = await testCharacter.actionLocator('Brace');
    await braceLocator.locator('.img').click();

    const disengageLocator = await testCharacter.actionLocator('Disengage');
    await disengageLocator.locator('.img').click();

    const dodgeLocator = await testCharacter.actionLocator('Dodge');
    await dodgeLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Consume Resource' }),
    ).toBeVisible();
    await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await testCharacter.checkResource('Focus', 0, 2);

    const dropLocator = await testCharacter.actionLocator('Drop');
    await dropLocator.locator('.img').click();

    const gainAdvantageLocator =
        await testCharacter.actionLocator('Gain Advantage');
    await gainAdvantageLocator.locator('.img').click();

    const grappleLocator = await testCharacter.actionLocator('Grapple');
    await grappleLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Grapple (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();

    const interactLocator = await testCharacter.actionLocator('Interact');
    await interactLocator.locator('.img').click();

    const moveLocator = await testCharacter.actionLocator('Move');
    await moveLocator.locator('.img').click();

    const reactiveStrikeLocator =
        await testCharacter.actionLocator('Reactive Strike');
    await reactiveStrikeLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Consume Resource' }),
    ).toBeVisible();
    await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await testCharacter.checkResource('Focus', 0, 2);
    // Expect no action to fire in chat

    const readyLocator = await testCharacter.actionLocator('Ready');
    await readyLocator.locator('.img').click();

    const recoverLocator = await testCharacter.actionLocator('Recover');
    await recoverLocator.locator('.img').click();
    await expect(page.getByText('Recover Consume 1 Use?')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(recoverLocator).toContainText(
        'Recover 2 1 Use from 0 / 1 0 / 1 Per scene',
    );

    const shoveLocator = await testCharacter.actionLocator('Shove');
    await shoveLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Shove (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();

    // const strikeLocator = await testCharacter.actionLocator('Strike');
    // await strikeLocator.locator('.img').click();

    const unarmedAttackLocator =
        await testCharacter.actionLocator('Unarmed Attack');
    await unarmedAttackLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Unarmed Attack (Athletics)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();

    const useASkillLocator = await testCharacter.actionLocator('Use A Skill');
    await useASkillLocator.locator('.img').click();
});
