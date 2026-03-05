// Custom Playwright fixtures providing FoundryVTT-specific test helpers.
// Usage: import { test, expect } from './fixtures/foundry-fixture';
//
// The `foundryPage` fixture navigates to FoundryVTT, re-joins the game world
// if needed (the WebSocket session doesn't survive across browser contexts),
// and returns a page that's ready on the game canvas.

import { test as base, expect, Page } from '@playwright/test';

import { SidebarPage } from '../page-objects/sidebar.page';
import { CharacterSheetPage } from '../page-objects/character-sheet.page';
import { dismissTours, joinWorldIfNeeded } from '../helpers/foundry-auth';

type FoundryFixtures = {
    /** A page that has navigated to FoundryVTT and joined the game world. */
    foundryPage: Page;
    sidebar: SidebarPage;
    characterSheet: CharacterSheetPage;
};

export const test = base.extend<FoundryFixtures>({
    foundryPage: async ({ page }, use) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await dismissTours(page);
        await joinWorldIfNeeded(page);
        await use(page);
    },

    // sidebar and characterSheet now depend on foundryPage, so requesting
    // either one automatically ensures we're on the game canvas.
    sidebar: async ({ foundryPage }, use) => {
        await use(new SidebarPage(foundryPage));
    },
    characterSheet: async ({ foundryPage }, use) => {
        await use(new CharacterSheetPage(foundryPage));
    },
});

export { expect };
