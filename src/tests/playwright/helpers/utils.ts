import { Page } from '@playwright/test';

export async function clearNotifications(page: Page) {
    await page.evaluate(() => ui.notifications.clear());
}

export async function clickAway(page: Page) {
    await page.getByText('Latency').click();
}
