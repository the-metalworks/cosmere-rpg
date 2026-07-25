import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { ActorType, ItemType } from '@src/system/types/cosmere';
import { createNewItem, deleteItem, ItemSheetRef } from './helpers/item';
import { createNewActor, deleteActor, ActorSheetRef } from './helpers/actor';

// Declare the types for your custom fixtures
interface MyFixtures {
    authenticatedPage: Page;
    createItem: (name: string, type: ItemType) => Promise<ItemSheetRef>;
    createActor: (name: string, type: ActorType) => Promise<ActorSheetRef>;
}

export const test = base.extend<MyFixtures>({
    authenticatedPage: async ({ page }, use) => {
        await page.goto('/game');
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready === true,
            { timeout: 120_000 },
        );

        const hardwareAccelerationWarning = page
            .locator('.notification.warning.permanent')
            .filter({
                hasText:
                    /Hardware Acceleration Disabled|does not have hardware acceleration enabled/i,
            });

        if (await hardwareAccelerationWarning.isVisible()) {
            await hardwareAccelerationWarning.click();
        }

        await use(page);
    },
    createItem: async ({ authenticatedPage: page }, use) => {
        const createdItems: ItemSheetRef[] = [];
        const factory = async (name: string, type: ItemType) => {
            const item = await createNewItem(page, name, type);
            createdItems.push(item);
            return item;
        };

        await use(factory);

        for (const actor of createdItems) {
            await deleteItem(page, actor);
        }
    },
    createActor: async ({ authenticatedPage: page }, use) => {
        const createdActors: ActorSheetRef[] = [];
        const factory = async (name: string, type: ActorType) => {
            const actor = await createNewActor(page, name, type);
            createdActors.push(actor);
            return actor;
        };

        await use(factory);

        for (const actor of createdActors) {
            await deleteActor(page, actor);
        }
    },
});

export { expect };
