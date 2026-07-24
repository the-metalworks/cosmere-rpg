import { ActorType } from '@src/system/types/cosmere';
import { test, expect } from './fixtures';
import {
    ActorSheetRef,
    createNewActor,
    getActorSheet,
    validateActor,
} from './helpers/actor';

test('Create character and open sheet', async ({ authenticatedPage: page }) => {
    const testCharacter = await createNewActor(
        page,
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = getActorSheet(page, testCharacter);
    await page.locator('input[name="system.attributes.str.value"]').click();
    await validateActor(page, testCharacter);
    // await expect(page.locator('#CharacterSheet-Actor-PBmg7GSlecAP9tVW')).toContainText('Ancestry');
    // await page.locator('input[name="name"]').click();
    // await expect(page.locator('#CharacterSheet-Actor-PBmg7GSlecAP9tVW')).toContainText('0 / 10');
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
