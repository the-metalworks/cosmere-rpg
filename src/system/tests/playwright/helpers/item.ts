import { expect, Locator, Page } from '@playwright/test';

import { ItemType } from '@src/system/types/cosmere';
import { paramsFromHook } from './hooks';

export interface ItemSheetRef {
    id: string;
    uuid: string;
    name: string;
    type: ItemType;
    typeLabel: string;
}

export async function getItemSheet(page: Page, sheetRef: ItemSheetRef) {
    const itemSheet = page.locator(
        `#${sheetRef.typeLabel}ItemSheet-Item-${sheetRef.id}`,
    );
    await expect(itemSheet).toHaveCount(1);
    return itemSheet;
}

export async function createNewItem(
    page: Page,
    name: string,
    type: ItemType,
): Promise<ItemSheetRef> {
    await page.getByRole('tab', { name: 'Items' }).click();
    await page.getByRole('button', { name: ' Create Item' }).click();
    await page.getByRole('combobox').selectOption(type);

    await page.locator(`input[name="name"]`).click();
    await page.locator(`input[name="name"]`).fill(name);
    await page.getByRole('heading', { name: 'Create Item' }).click();
    const newItemPromise = waitForNewItem(page);
    await page.getByRole('button', { name: ' Create Item' }).click();
    const [createdItem, createOptions, id] = await newItemPromise;
    expect(createdItem.name == name);
    expect(createdItem.type == type);
    expect(createdItem.id);
    expect(createdItem.uuid);
    const typeLabel =
        createdItem.type.charAt(0).toUpperCase() + createdItem.type.slice(1);
    const itemSheetRef = {
        id: createdItem.id!,
        uuid: createdItem.uuid,
        name: createdItem.name,
        type: createdItem.type,
        typeLabel,
    };
    return itemSheetRef;
}

async function waitForNewItem(
    page: Page,
): Promise<Hooks.HookParameters<'createItem'>> {
    return paramsFromHook(page, 'createItem');
}

export async function deleteItem(page: Page, sheetRef: ItemSheetRef) {
    await page.evaluate(async (id) => {
        await game.items?.get(id)?.delete();
    }, sheetRef.id);
}
