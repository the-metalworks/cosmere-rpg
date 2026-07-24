import { expect, Locator, Page } from '@playwright/test';
import { ActorType } from '@src/system/types/cosmere';
import { paramsFromHook } from './hooks';
import type { CosmereActor } from '@src/system/documents';

export interface ActorSheetRef {
    id: string;
    uuid: string;
    name: string;
    type: ActorType;
}

export async function createNewActor(
    page: Page,
    name: string,
    type: ActorType,
): Promise<ActorSheetRef> {
    await page.getByRole('tab', { name: 'Actors' }).click();
    await page.getByRole('button', { name: ' Create Actor' }).click();
    await page.getByRole('textbox', { name: 'Character' }).click();
    await page.getByRole('textbox', { name: 'Character' }).fill(name);
    await page.getByRole('combobox').selectOption(type);
    const newActorPromise = waitForNewActor(page);
    await page.getByRole('button', { name: ' Create Actor' }).click();
    const [createdActor, createOptions, id] = await newActorPromise;
    console.log('Newly created actor:');
    console.log(createdActor);
    expect(createdActor.name == name);
    expect(createdActor.type == type);
    const actorSheetRef = {
        id,
        uuid: createdActor.uuid,
        name: createdActor.name,
        type: createdActor.type as ActorType,
    };
    console.log('Created new actorSheetRef:');
    console.log(actorSheetRef);
    return actorSheetRef;
}

async function waitForNewActor(
    page: Page,
): Promise<Hooks.HookParameters<'createActor'>> {
    return paramsFromHook(page, 'createActor');
}

export function getActorSheet(page: Page, sheetRef: ActorSheetRef) {
    return page.locator(`#CharacterSheet-Actor-${sheetRef.id}`);
}

export async function validateActor(page: Page, sheetRef: ActorSheetRef) {
    const actorData = await page.evaluate(async (uuid) => {
        console.log(`Getting actor from UUID ${uuid}`);
        const actor = await fromUuid(uuid);
        if (!(actor instanceof CONFIG.Actor.documentClass)) {
            throw new Error(`${uuid} did not resolve to an Actor`);
        }
        return actor;
    }, sheetRef.uuid);
    const actorSheet = getActorSheet(page, sheetRef);
    expect(actorSheet);
    await validateActorDetails(actorData as CosmereActor, actorSheet);
}

export async function validateActorDetails(
    actorData: CosmereActor,
    actorSheet: Locator,
) {
    // await validateActorDetailsAttributes(actorData, actorSheet);
    await validateActorDetailsResources(actorData, actorSheet);
}

// export async function validateActorDetailsAttributes(actorData: CosmereActor, actorSheet: Locator){
//     const attributesSection = actorSheet.locator('app-actor-attributes');
//     const strAttributeSection = attributesSection.locator('input[name="system.attributes.str.value"]');
//     const spdAttributeSection = attributesSection.locator('input[name="system.attributes.spd.value"]');
//     const intAttributeSection = attributesSection.locator('input[name="system.attributes.int.value"]');
//     const wilAttributeSection = attributesSection.locator('input[name="system.attributes.wil.value"]');
//     const awaAttributeSection = attributesSection.locator('input[name="system.attributes.awa.value"]');
//     const preAttributeSection = attributesSection.locator('input[name="system.attributes.pre.value"]');
// }

export async function validateActorDetailsResources(
    actorData: CosmereActor,
    actorSheet: Locator,
) {
    const healthBar = actorSheet
        .locator('app-actor-resource')
        .filter({ hasText: 'Health' });
    expect((await healthBar.count()) == 1);
    const expectedHealthVal =
        actorData.system.resources.hea.value +
        actorData.system.resources.hea.bonus;
    const expectedHealthMax = actorData.system.resources.hea.max.value;
    await expect(healthBar).toContainText(
        `${expectedHealthVal} / ${expectedHealthMax}`,
    );

    const focusBar = actorSheet
        .locator('app-actor-resource')
        .filter({ hasText: 'Focus' });
    expect((await focusBar.count()) == 1);
    const expectedFocusVal =
        actorData.system.resources.foc.value +
        actorData.system.resources.foc.bonus;
    const expectedFocusMax = actorData.system.resources.foc.max.value;
    await expect(focusBar).toContainText(
        `${expectedFocusVal} / ${expectedFocusMax}`,
    );

    const investitureBar = actorSheet
        .locator('app-actor-resource')
        .filter({ hasText: 'Investiture' });
    expect((await investitureBar.count()) == 1);
    const expectedInvestitureVal =
        actorData.system.resources.inv.value +
        actorData.system.resources.inv.bonus;
    const expectedInvestitureMax = actorData.system.resources.inv.max.value;
    await expect(investitureBar).toContainText(
        `${expectedInvestitureVal} / ${expectedInvestitureMax}`,
    );
}
