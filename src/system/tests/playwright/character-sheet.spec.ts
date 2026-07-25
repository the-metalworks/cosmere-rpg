import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from './fixtures';
import {
    checkActorAttribute,
    checkActorDefense,
    checkActorResource,
    createNewActor,
    getActorSheet,
} from './helpers/actor';

test('Create character, check default values', async ({
    authenticatedPage: page,
}) => {
    const testCharacter = await createNewActor(
        page,
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
    // await page.locator('input[name="system.attributes.str.value"]').click();
    // await page.locator('input[name="system.attributes.str.value"]').fill('1');
    // await page.getByText('3 Ancestry Level 0 Deflect 20').click();
    // await expect(page.locator('#CharacterSheet-Actor-PBmg7GSlecAP9tVW')).toContainText('1 / 11');
    // await page.getByText('/ 2').click();
    // await expect(page.locator('#CharacterSheet-Actor-PBmg7GSlecAP9tVW')).toContainText('0 / 2');
    // await page.locator('input[name="system.attributes.wil.value"]').click();
    // await page.locator('input[name="system.attributes.wil.value"]').fill('2');
    // await page.getByText('3 Ancestry Level 0 Deflect 20').click();
    // await expect(page.locator('#CharacterSheet-Actor-PBmg7GSlecAP9tVW')).toContainText('2 / 4');
});
