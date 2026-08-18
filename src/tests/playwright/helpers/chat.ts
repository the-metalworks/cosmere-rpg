import { Locator, Page } from '@playwright/test';

export function mostRecentChatMessage(page: Page): Locator {
    return page.locator('#chat .chat-message').last();
}
