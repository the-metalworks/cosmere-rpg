import { expect, Locator, Page } from '@playwright/test';

import { ItemType } from '@src/system/types/cosmere';
import { paramsFromHook } from './hooks';

interface ItemSheetRefData {
    id: string;
    uuid: string;
    name: string;
    type: ItemType;
    typeLabel: string;
}

export class ItemSheetRef {
    public readonly locator: Locator;
    public readonly id: string;
    public readonly uuid: string;
    public readonly name: string;
    public readonly type: ItemType;

    constructor(
        private readonly page: Page,
        sheetRefData: ItemSheetRefData,
    ) {
        this.id = sheetRefData.id;
        this.uuid = sheetRefData.uuid;
        this.name = sheetRefData.name;
        this.type = sheetRefData.type;
        const sheetUuidString = sheetRefData.uuid.replaceAll('.', '-');
        this.locator = page.locator(
            `#${sheetRefData.typeLabel}ItemSheet-${sheetUuidString}`,
        );
    }

    public static async create(
        page: Page,
        name: string,
        type: ItemType,
    ): Promise<ItemSheetRefData> {
        await page.getByRole('tab', { name: 'Items' }).click();
        await page.getByRole('button', { name: ' Create Item' }).click();
        await page.getByRole('combobox').selectOption(type);

        await page.locator(`input[name="name"]`).click();
        await page.locator(`input[name="name"]`).fill(name);
        await page.getByRole('heading', { name: 'Create Item' }).click();
        const newItemPromise = paramsFromHook(page, 'createItem');
        await page.getByRole('button', { name: ' Create Item' }).click();
        return newItemPromiseToSheetRef(newItemPromise, {
            expectedName: name,
            expectedType: type,
        });
    }

    public async delete() {
        await this.page.evaluate(async (id) => {
            await game.items?.get(id)?.delete();
        }, this.id);
    }

    public async createEmbeddedItem() {
        const embeddedActionPromise = paramsFromHook(this.page, 'createItem');
        await this.locator.locator('.controls > a').first().click();
        const embeddedAction = await newItemPromiseToSheetRef(
            embeddedActionPromise,
            { expectedType: ItemType.Action },
        );
        return new ItemSheetRef(this.page, embeddedAction);
    }
}

async function newItemPromiseToSheetRef(
    newItemPromise: Promise<Hooks.HookParameters<'createItem'>>,
    expectedVals?: { expectedName?: string; expectedType: ItemType },
) {
    const [createdItem, createOptions, id] = await newItemPromise;
    if (expectedVals?.expectedName) {
        expect(createdItem.name == expectedVals.expectedName);
    }
    if (expectedVals?.expectedType) {
        expect(createdItem.type == expectedVals.expectedType);
    }
    expect(createdItem.id);
    expect(createdItem.uuid);
    const typeLabel =
        createdItem.type.charAt(0).toUpperCase() + createdItem.type.slice(1);
    const itemSheetRefData = {
        id: createdItem.id!,
        uuid: createdItem.uuid,
        name: createdItem.name,
        type: createdItem.type,
        typeLabel,
    };
    return itemSheetRefData;
}
