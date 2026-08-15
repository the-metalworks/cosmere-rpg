import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { ActorType, ItemType } from '@src/system/types/cosmere';
import { ItemSheetRef } from './helpers/item';
import { ActorSheetRef } from './helpers/actor';
import { clearNotifications } from './helpers/utils';

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
            { timeout: 30_000 },
        );

        await clearNotifications(page);
        await page.evaluate(() => {
            game.audio.locked = false;
        });

        await use(page);
    },
    createItem: async ({ authenticatedPage: page }, use) => {
        const createdItems: ItemSheetRef[] = [];
        const factory = async (name: string, type: ItemType) => {
            const itemSheetRefData = await ItemSheetRef.create(
                page,
                name,
                type,
            );
            const itemSheetRef = new ItemSheetRef(page, itemSheetRefData);
            createdItems.push(itemSheetRef);
            return itemSheetRef;
        };

        await use(factory);

        for (const item of createdItems) {
            await item.delete();
        }
    },
    createActor: async ({ authenticatedPage: page }, use) => {
        const createdActors: ActorSheetRef[] = [];
        const factory = async (name: string, type: ActorType) => {
            const actorSheetRefData = await ActorSheetRef.create(
                page,
                name,
                type,
            );
            const actorSheetRef = new ActorSheetRef(page, actorSheetRefData);
            createdActors.push(actorSheetRef);
            return actorSheetRef;
        };

        await use(factory);

        for (const actor of createdActors) {
            await actor.delete();
        }
    },
});

export { expect };
