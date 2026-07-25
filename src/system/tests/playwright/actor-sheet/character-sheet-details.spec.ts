import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import {
    checkActorAttribute,
    checkActorDefense,
    checkActorResource,
    createNewActor,
    getActorSheet,
    updateActorAttribute,
    updateActorResource,
} from '../helpers/actor';
import { html5DragAndDrop } from '../helpers/drag-drop';

test('Resources/Attribute/Defenses', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = await getActorSheet(page, testCharacter);
    await checkActorResource(testCharacterSheet, 'Health', 0, 10);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorResource(testCharacterSheet, 'Investiture', 0, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Intellect, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Willpower, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Awareness, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Presence, 0);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Spiritual, 10);

    // Update strength, check new values
    await updateActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorResource(testCharacterSheet, 'Health', 1, 11);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 0);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 11);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);

    // Update speed, check new values
    await updateActorAttribute(testCharacterSheet, Attribute.Speed, 2);
    await checkActorResource(testCharacterSheet, 'Health', 1, 11);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 2);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 13);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);

    // Update health to less than max
    await updateActorResource(testCharacterSheet, 'Health', 5);
    await checkActorResource(testCharacterSheet, 'Health', 5, 11);

    // Update health to more than max
    await updateActorResource(testCharacterSheet, 'Health', 100);
    await checkActorResource(testCharacterSheet, 'Health', 11, 11);
});

test('Ancestry/Culture/Path Drag and Drop', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = await getActorSheet(page, testCharacter);
    await checkActorResource(testCharacterSheet, 'Health', 0, 10);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorResource(testCharacterSheet, 'Investiture', 0, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Intellect, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Willpower, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Awareness, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Presence, 0);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Spiritual, 10);
    await page.getByRole('tab', { name: 'Compendium Packs' }).click();
    await page
        .locator('span')
        .filter({ hasText: 'Stormlight Starter Rules' })
        .click();

    // Add Human ancestry
    await page.locator('a').filter({ hasText: 'Ancestries' }).click();
    const humanAncestryElement = page.getByText('Human');
    await html5DragAndDrop(page, humanAncestryElement, testCharacterSheet);
    await expect(
        testCharacterSheet.locator('app-character-ancestry'),
    ).toContainText('Human Ancestry');
    await page
        .locator('#compendium-cosmere-rpg_ancestries')
        .getByRole('button', { name: 'Close Window' })
        .click();

    // Add Herdazian Culture
    await page.locator('a').filter({ hasText: 'Cultures' }).click();
    const herdazianCultureElement = page.getByText('Herdazian');
    await html5DragAndDrop(page, herdazianCultureElement, testCharacterSheet);
    await expect(
        testCharacterSheet.locator('app-character-culture'),
    ).toContainText('Herdazian Culture');
    await page
        .locator('#compendium-cosmere-rpg_cultures')
        .getByRole('button', { name: 'Close Window' })
        .click();

    // Add Agent path

    await page.locator('a').filter({ hasText: 'Heroic Paths' }).click();
    await page.locator('span').filter({ hasText: 'Agent' }).click();
    const agentPathElement = page.locator('a').filter({ hasText: /^Agent$/ });
    await html5DragAndDrop(page, agentPathElement, testCharacterSheet);
    await expect(
        testCharacterSheet
            .locator('app-actor-skill')
            .filter({ hasText: 'Insight' }),
    ).toContainText('+ 1 Insight AWA');
    await page.locator('a').filter({ hasText: '3' }).click();
    await page.locator('.sheet-navigation > a:nth-child(2)').click();
    await expect(page.locator('app-character-talents-list')).toContainText(
        'Agent Talents',
    );
    await expect(page.locator('app-character-talents-list')).toContainText(
        'Opportunist',
    );
});
