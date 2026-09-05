import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import { mostRecentChatMessage } from '../helpers/chat';
import { html5DragAndDrop } from '../helpers/drag-drop';
import { clearNotifications } from '../helpers/utils';
import { getLocatorForNextWindowToOpen } from '../helpers/hooks';
import {
    getLocatorForCompendiumItem,
    openCompendium,
} from '../helpers/compendium';

test('Add all basic actions, use them all', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;
    const actionsCompendium = await openCompendium(page, 'Actions', [
        'Stormlight Starter Rules',
    ]);
    const basicActionsPackItem = await getLocatorForCompendiumItem(
        actionsCompendium,
        'Basic Actions Pack',
    );
    await html5DragAndDrop(page, basicActionsPackItem, testCharacterSheet);

    await testCharacter.switchToActionsTab();

    // Expect all basic actions to appear on character sheet
    const basicActionsList =
        await testCharacter.itemListSectionLocator('Basic Actions');
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
        basicActionsList,
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
    await page.getByRole('tab', { name: 'Chat Messages' }).click();
    await expect(mostRecentChatMessage(page)).toContainText('Aid');

    const avoidDangerLocator =
        await testCharacter.actionLocator('Avoid Danger');
    await avoidDangerLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Avoid Danger (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();
    await expect(mostRecentChatMessage(page)).toContainText('Avoid Danger');

    const banterLocator = await testCharacter.actionLocator('Banter');
    await banterLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Banter');

    const braceLocator = await testCharacter.actionLocator('Brace');
    await braceLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Brace');

    const disengageLocator = await testCharacter.actionLocator('Disengage');
    await disengageLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Disengage');

    const dodgeLocator = await testCharacter.actionLocator('Dodge');
    await dodgeLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Consume Resource' }),
    ).toBeVisible();
    await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await testCharacter.checkResource('Focus', 0, 2);
    await expect(mostRecentChatMessage(page)).toContainText('Dodge');

    const dropLocator = await testCharacter.actionLocator('Drop');
    await dropLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Drop');

    const gainAdvantageLocator =
        await testCharacter.actionLocator('Gain Advantage');
    await gainAdvantageLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Gain Advantage');

    const grappleLocator = await testCharacter.actionLocator('Grapple');
    await grappleLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Grapple (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();
    await expect(mostRecentChatMessage(page)).toContainText('Grapple');

    const interactLocator = await testCharacter.actionLocator('Interact');
    await interactLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Interact');

    const moveLocator = await testCharacter.actionLocator('Move');
    await moveLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Move');

    const reactiveStrikeLocator =
        await testCharacter.actionLocator('Reactive Strike');
    await reactiveStrikeLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Consume Resource' }),
    ).toBeVisible();
    await expect(page.getByText('Test Character Consume 1')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await testCharacter.checkResource('Focus', 0, 2);
    await expect(mostRecentChatMessage(page)).toContainText('Move');

    const readyLocator = await testCharacter.actionLocator('Ready');
    await readyLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Ready');

    const recoverLocator = await testCharacter.actionLocator('Recover');
    await recoverLocator.locator('.img').click();
    await expect(page.getByText('Recover Consume 1 Use?')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(recoverLocator).toContainText(
        'Recover 2 1 Use from 0 / 1 0 / 1 Per scene',
    );
    await expect(mostRecentChatMessage(page)).toContainText('Recover');

    const shoveLocator = await testCharacter.actionLocator('Shove');
    await shoveLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Shove (Custom Skill)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();
    await expect(mostRecentChatMessage(page)).toContainText('Shove');

    // const strikeLocator = await testCharacter.actionLocator('Strike');
    // await strikeLocator.locator('.img').click();

    const unarmedAttackLocator =
        await testCharacter.actionLocator('Unarmed Attack');
    await unarmedAttackLocator.locator('.img').click();
    await expect(
        page.getByRole('heading', { name: 'Unarmed Attack (Athletics)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roll', exact: true }).click();
    await expect(mostRecentChatMessage(page)).toContainText('Unarmed Attack');

    const useASkillLocator = await testCharacter.actionLocator('Use A Skill');
    await useASkillLocator.locator('.img').click();
    await expect(mostRecentChatMessage(page)).toContainText('Use A Skill');
});

test('Add weapon, validate strike action details', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;
    const itemsCompendium = await openCompendium(page, 'Items', [
        'Stormlight Starter Rules',
    ]);
    const axeItem = await getLocatorForCompendiumItem(itemsCompendium, 'Axe', [
        'Stormlight',
        'Weapons',
    ]);
    await html5DragAndDrop(page, axeItem, testCharacterSheet);
    await testCharacterSheet.locator('a').filter({ hasText: '3' }).click();
    // Validate that since the Axe isn't equipped, the "Strike" action is not visible
    await expect(
        testCharacterSheet.getByText('Strike: Axe 1 — —'),
    ).not.toBeVisible();

    // Equip the axe
    await testCharacterSheet
        .locator('.sheet-navigation > a:nth-child(4)')
        .click();
    await testCharacterSheet.locator('div.detail.slim.equip > a').click();

    //Validate that the Axe strike action is now visible
    await testCharacterSheet.locator('a').filter({ hasText: '3' }).click();
    await expect(
        testCharacterSheet.getByText('Strike: Axe 1 — —'),
    ).toBeVisible();
    await testCharacterSheet.getByText('Strike: Axe').click();
    await expect(
        testCharacterSheet.locator('app-actor-actions-list-entry'),
    ).toContainText(
        'Damage 1d6 keen; Range Melee; Traits Thrown [20/60]; Expert Traits Offhand;Type Heavy Weapon; Weapons Skill Heavy; Price 20 mk; Weight 2 lb.;',
    );
    await testCharacterSheet
        .locator('.controls.icon > a:nth-child(2)')
        .first()
        .click();
    await expect(
        testCharacterSheet.getByRole('button', { name: ' View' }),
    ).toBeVisible();
    const axeStrikeActionSheetPromise = getLocatorForNextWindowToOpen(page);
    await testCharacterSheet.getByRole('button', { name: ' View' }).click();
    const axeStrikeActionSheet = await axeStrikeActionSheetPromise;
    await expect(
        axeStrikeActionSheet
            .locator('section')
            .filter({ hasText: 'Action Description Details' })
            .first(),
    ).toBeVisible();
    await axeStrikeActionSheet
        .getByRole('button', { name: 'Close Window' })
        .click();

    // Test the Loaded automations
    await testCharacterSheet
        .locator('.sheet-navigation > a:nth-child(4)')
        .click();
    await testCharacterSheet
        .locator('div:nth-child(7) > a:nth-child(2)')
        .click();
    const axeSheetPromise = getLocatorForNextWindowToOpen(page);
    await testCharacterSheet.getByRole('button', { name: ' Edit' }).click();
    const axeSheet = await axeSheetPromise;
    await axeSheet.getByText('Details', { exact: true }).click();
    await axeSheet.getByText('Traits Thrown', { exact: true }).click();
    await axeSheet
        .locator('input[name="system.traits.loaded.defaultActive"]')
        .check();
    await axeSheet
        .locator('input[name="system.traits.loaded.defaultValue"]')
        .click();
    await axeSheet
        .locator('input[name="system.traits.loaded.defaultValue"]')
        .fill('3');
    await axeSheet.getByText('Traits Loaded, Thrown').click();
    await expect(axeSheet.locator('app-item-details-resources')).toContainText(
        'Primary ResourceAmmo',
    );
    await axeSheet.getByText('Actions', { exact: true }).click();
    await expect(axeSheet.locator('app-item-actions-list')).toContainText(
        'Strike: Axe 1 1 Ammo from —',
    );
    await expect(axeSheet.locator('app-item-actions-list')).toContainText(
        'Reload: Axe 1 — —',
    );
    await axeSheet.getByRole('button', { name: 'Close Window' }).click();
    await expect(
        testCharacterSheet.locator('app-actor-equipment-list'),
    ).toContainText('Axe Melee, One Handed, Loaded [3], Thrown 1 2 3 / 3');
    await testCharacterSheet
        .locator('a')
        .filter({ hasText: '3' })
        .first()
        .click();
    await expect(
        testCharacterSheet.locator('app-actor-actions-list'),
    ).toContainText('Axe 3 / 3');
    await testCharacterSheet.getByText('Strike: Axe 1 1 Ammo from 3').click();
    await expect(
        testCharacterSheet.locator('app-actor-actions-list'),
    ).toContainText('Strike: Axe 1 1 Ammo from 3 / 3 —');
    await expect(
        testCharacterSheet.locator('app-actor-actions-list'),
    ).toContainText('Reload: Axe 1 — —');
});

test('Edit mode', async ({ authenticatedPage: page, createActor }) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;
    await testCharacter.switchToActionsTab();

    const heroicPathsCompendium = await openCompendium(page, 'Heroic Paths', [
        'Stormlight Starter Rules',
    ]);
    const envoyPathElement = await getLocatorForCompendiumItem(
        heroicPathsCompendium,
        'Envoy',
        ['Envoy'],
    );

    await html5DragAndDrop(page, envoyPathElement, testCharacterSheet);
    await clearNotifications(page);
    await expect(
        testCharacterSheet
            .getByRole('listitem')
            .filter({ hasText: 'Envoy Actions Action Cost' }),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .getByRole('listitem')
            .filter({ hasText: 'Basic Actions Action Cost' }),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'app-actor-actions-list > .item-list.collapsible > .item.header > .details > .controls > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('.item-list.empty > .item > .details > .controls > a')
            .first(),
    ).toBeVisible();

    // Toggle edit mode off
    await page.locator('.fa-solid.fa-pen').click();
    await expect(
        testCharacterSheet
            .getByRole('listitem')
            .filter({ hasText: 'Envoy Actions Action Cost' }),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'app-actor-actions-list > .item-list.collapsible > .item.header > .details > .controls > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.getByText('Rousing Presence 1 — —'),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .getByRole('listitem')
            .filter({ hasText: 'Basic Actions Action Cost' }),
    ).not.toBeVisible();
});
