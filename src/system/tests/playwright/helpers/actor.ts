import { expect, Locator, Page } from '@playwright/test';
import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
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
    expect(createdActor.name == name);
    expect(createdActor.type == type);
    expect(createdActor.id);
    expect(createdActor.uuid);
    const actorSheetRef = {
        id: createdActor.id!,
        uuid: createdActor.uuid,
        name: createdActor.name,
        type: createdActor.type as ActorType,
    };
    return actorSheetRef;
}

async function waitForNewActor(
    page: Page,
): Promise<Hooks.HookParameters<'createActor'>> {
    return paramsFromHook(page, 'createActor');
}

export async function deleteActor(page: Page, sheetRef: ActorSheetRef) {
    await page.evaluate(async (id) => {
        await game.actors?.get(id)?.delete();
    }, sheetRef.id);
}

export async function getActorSheet(page: Page, sheetRef: ActorSheetRef) {
    const actorSheet = page.locator(`#CharacterSheet-Actor-${sheetRef.id}`);
    await expect(actorSheet).toHaveCount(1);
    return actorSheet;
}

export async function checkActorResource(
    actorSheet: Locator,
    resourceLabel: string,
    expectedVal: number,
    expectedMax: number,
) {
    const resourceBar = actorSheet
        .locator('app-actor-resource')
        .filter({ hasText: resourceLabel });
    await expect(resourceBar).toHaveCount(1);
    await expect(resourceBar).toContainText(
        `${expectedVal}\n/\n${expectedMax}`,
    );
}

export async function checkActorAttribute(
    actorSheet: Locator,
    attribute: Attribute,
    expectedVal: number,
) {
    const attributeInput = actorSheet.locator(
        `input[name="system.attributes.${attribute}.value"]`,
    );
    await expect(attributeInput).toHaveCount(1);
    await expect(attributeInput).toHaveValue(`${expectedVal}`);
}

export async function checkActorDefense(
    actorSheet: Locator,
    attributeGroup: AttributeGroup,
    expectedVal: number,
) {
    const defenseDisplay = actorSheet
        .locator(`div.attribute-group[data-id=${attributeGroup}]`)
        .locator(`div.sheet-stack.defense`);
    await expect(defenseDisplay).toHaveCount(1);
    await expect(defenseDisplay).toContainText(`${expectedVal}`);
}

export async function updateActorAttribute(
    actorSheet: Locator,
    attribute: Attribute,
    newVal: number,
) {
    await actorSheet
        .locator(`input[name="system.attributes.${attribute}.value"]`)
        .click();
    await actorSheet
        .locator(`input[name="system.attributes.${attribute}.value"]`)
        .fill(`${newVal}`);
    await actorSheet.getByRole('banner').click();
}

export async function updateActorResource(
    actorSheet: Locator,
    resourceLabel: string,
    newVal: number,
) {
    const resourceBar = actorSheet
        .locator('app-actor-resource')
        .filter({ hasText: resourceLabel });
    await resourceBar.click();
    const resourceBarInput = resourceBar.locator(`input`);
    await resourceBarInput.fill(`${newVal}`);
    await actorSheet.getByRole('banner').click();
}
