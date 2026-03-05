// Page object model for the FoundryVTT sidebar.
// Encapsulates sidebar tab navigation and common sidebar interactions.
// Selectors target FoundryVTT v13 markup.

import { Page, Locator } from '@playwright/test';

export class SidebarPage {
    readonly page: Page;
    readonly actorsTab: Locator;
    readonly itemsTab: Locator;
    readonly chatTab: Locator;
    readonly settingsTab: Locator;

    constructor(page: Page) {
        this.page = page;
        this.actorsTab = page.locator('#sidebar-tabs [data-tab="actors"]');
        this.itemsTab = page.locator('#sidebar-tabs [data-tab="items"]');
        this.chatTab = page.locator('#sidebar-tabs [data-tab="chat"]');
        this.settingsTab = page.locator('#sidebar-tabs [data-tab="settings"]');
    }

    async navigateToActors(): Promise<void> {
        await this.actorsTab.click();
        await this.page.waitForSelector('#actors .directory-list');
    }

    async navigateToItems(): Promise<void> {
        await this.itemsTab.click();
        await this.page.waitForSelector('#items .directory-list');
    }

    async navigateToSettings(): Promise<void> {
        await this.settingsTab.click();
    }

    async createActor(name: string, type: string): Promise<void> {
        await this.navigateToActors();
        await this.page.locator('#actors .create-entry').click();
        // Fill the create dialog
        await this.page.locator('input[name="name"]').fill(name);
        await this.page.locator('select[name="type"]').selectOption(type);
        await this.page.locator('button[data-action="ok"]').click();
    }
}
