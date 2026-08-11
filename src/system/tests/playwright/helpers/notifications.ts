import { Page } from '@playwright/test';

export async function clearNotifications(page: Page) {
    const notifications = page.locator('.notification');

    while ((await notifications.count()) > 0) {
        await notifications.first().click();
    }
}
