import { expect, Locator, Page } from '@playwright/test';
import { getLocatorForNextWindowToOpen } from './hooks';

export async function openCompendium(
    page: Page,
    name: string,
    folders?: string[],
) {
    await page.getByRole('tab', { name: 'Compendium Packs' }).click();
    const compendiumTab = page.locator('#compendium');
    let focusedLocator = compendiumTab;

    if (folders) {
        for (const folder of folders) {
            focusedLocator = focusedLocator
                .locator('li.folder')
                .filter({ hasText: folder });
            await focusedLocator.click();
        }
    }

    const compendiumWindowPromise = getLocatorForNextWindowToOpen(page);
    await focusedLocator.locator('a').filter({ hasText: name }).click();
    const compendiumWindow = await compendiumWindowPromise;
    return compendiumWindow;
}

export async function getLocatorForCompendiumItem(
    compendiumWindow: Locator,
    name: string,
    folders?: string[],
) {
    let focusedLocator = compendiumWindow;

    if (folders) {
        for (const folder of folders) {
            focusedLocator = focusedLocator
                .locator('li.folder')
                .filter({ hasText: folder });
            await focusedLocator.click();
        }
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const itemLocator = focusedLocator
        .locator('li.document.item')
        .filter({ hasText: new RegExp(`^\\s*${escapedName}\\s*$`) });
    await expect(itemLocator).toHaveCount(1);
    return itemLocator;
}
