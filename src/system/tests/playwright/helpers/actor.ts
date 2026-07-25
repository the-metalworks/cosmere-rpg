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
